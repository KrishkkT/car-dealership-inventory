import { Request, Response } from 'express';
import { pool } from '../config/db';

export const createVehicle = async (req: Request, res: Response): Promise<any> => {
  const { make, model, category, price, quantity } = req.body;

  // Basic presence checks
  if (make === undefined || model === undefined || category === undefined || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'All fields (make, model, category, price, quantity) are required' });
  }

  // Type and range validation
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
