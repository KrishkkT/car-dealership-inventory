import { Request, Response } from 'express';
import { pool } from '../config/db';

export const createVehicle = async (req: Request, res: Response): Promise<any> => {
  const { make, model, category, price, quantity } = req.body;

  if (make === undefined || model === undefined || category === undefined || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'All fields (make, model, category, price, quantity) are required' });
  }

  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number' });
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative integer' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO vehicles (make, model, category, price, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [make, model, category, price, quantity]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const listVehicles = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY id');
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchVehicles = async (req: Request, res: Response): Promise<any> => {
  const { make, model, category, minPrice, maxPrice } = req.query;

  try {
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params: any[] = [];

    if (make) {
      params.push(make);
      sql += ` AND make ILIKE $${params.length}`;
    }
    if (model) {
      params.push(model);
      sql += ` AND model ILIKE $${params.length}`;
    }
    if (category) {
      params.push(category);
      sql += ` AND category ILIKE $${params.length}`;
    }
    if (minPrice) {
      params.push(parseFloat(minPrice as string));
      sql += ` AND price >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(parseFloat(maxPrice as string));
      sql += ` AND price <= $${params.length}`;
    }

    sql += ' ORDER BY id';

    const result = await pool.query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { make, model, category, price, quantity } = req.body;

  if (make === undefined || model === undefined || category === undefined || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'All fields (make, model, category, price, quantity) are required' });
  }

  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number' });
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative integer' });
  }

  try {
    const result = await pool.query(
      'UPDATE vehicles SET make=$1, model=$2, category=$3, price=$4, quantity=$5 WHERE id=$6 RETURNING *',
      [make, model, category, price, quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const purchaseVehicle = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Select and lock row
    const vRes = await client.query('SELECT * FROM vehicles WHERE id = $1 FOR UPDATE', [id]);
    if (vRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vRes.rows[0];
    if (vehicle.quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Vehicle is out of stock' });
    }

    // Decrement quantity
    const updateRes = await client.query(
      'UPDATE vehicles SET quantity = quantity - 1 WHERE id = $1 RETURNING *',
      [id]
    );
    const updatedVehicle = updateRes.rows[0];

    // Log purchase
    await client.query(
      'INSERT INTO purchases (user_id, vehicle_id) VALUES ($1, $2)',
      [userId, id]
    );

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Vehicle purchased successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const restockVehicle = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const result = await pool.query(
      'UPDATE vehicles SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    return res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
