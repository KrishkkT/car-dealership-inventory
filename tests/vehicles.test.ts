import request from 'supertest';
import app from '../src/app';
import { pool } from './setup';
import jwt from 'jsonwebtoken';

describe('POST /api/vehicles', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Insert an admin user
    const adminRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['admin@example.com', 'hashedpassword', 'admin']
    );
    const adminUser = adminRes.rows[0];
    adminToken = jwt.sign(adminUser, process.env.JWT_SECRET || 'testsecretjwtkey');

    // Insert a standard user
    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user@example.com', 'hashedpassword', 'user']
    );
    const regularUser = userRes.rows[0];
    userToken = jwt.sign(regularUser, process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should successfully add a new vehicle if user is an admin', async () => {
    const vehicleData = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000.00,
      quantity: 5,
    };

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(vehicleData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.make).toBe(vehicleData.make);
    expect(res.body.model).toBe(vehicleData.model);
    expect(Number(res.body.price)).toBe(vehicleData.price);
    expect(res.body.quantity).toBe(vehicleData.quantity);

    // Verify database entry
    const dbRes = await pool.query('SELECT * FROM vehicles WHERE id = $1', [res.body.id]);
    expect(dbRes.rows.length).toBe(1);
    expect(dbRes.rows[0].make).toBe(vehicleData.make);
  });

  it('should return 403 Forbidden if user is not an admin', async () => {
    const vehicleData = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000.00,
      quantity: 5,
    };

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`)
      .send(vehicleData);

    expect(res.status).toBe(403);
  });

  it('should return 401 Unauthorized if no token is provided', async () => {
    const vehicleData = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000.00,
      quantity: 5,
    };

    const res = await request(app)
      .post('/api/vehicles')
      .send(vehicleData);

    expect(res.status).toBe(401);
  });

  it('should return 400 Bad Request if validation fails (e.g., negative price)', async () => {
    const invalidData = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: -500.00,
      quantity: 5,
    };

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidData);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/vehicles', () => {
  let userToken: string;

  beforeEach(async () => {
    // Clear and seed vehicles
    await pool.query('TRUNCATE TABLE purchases, vehicles CASCADE');
    await pool.query(
      `INSERT INTO vehicles (make, model, category, price, quantity) VALUES 
      ('Toyota', 'Camry', 'Sedan', 25000.00, 5),
      ('Ford', 'F-150', 'Truck', 40000.00, 3)`
    );

    // Standard user token
    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user-get@example.com', 'hashedpassword', 'user']
    );
    userToken = jwt.sign(userRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should return 401 if token is not provided', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });

  it('should successfully return all vehicles for authenticated users', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('make');
    expect(res.body[0]).toHaveProperty('model');
  });
});

describe('GET /api/vehicles/search', () => {
  let userToken: string;

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE purchases, vehicles CASCADE');
    await pool.query(
      `INSERT INTO vehicles (make, model, category, price, quantity) VALUES 
      ('Toyota', 'Camry', 'Sedan', 25000.00, 5),
      ('Honda', 'Civic', 'Sedan', 22000.00, 10),
      ('Ford', 'F-150', 'Truck', 45000.00, 3)`
    );

    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user-search@example.com', 'hashedpassword', 'user']
    );
    userToken = jwt.sign(userRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should successfully filter vehicles by make', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Toyota')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].make).toBe('Toyota');
  });

  it('should successfully filter vehicles by category', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?category=Sedan')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should filter vehicles by price range', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=20000&maxPrice=30000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2); // Camry and Civic
  });
});

describe('PUT /api/vehicles/:id', () => {
  let adminToken: string;
  let userToken: string;
  let vehicleId: number;

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE purchases, vehicles CASCADE');
    const vRes = await pool.query(
      "INSERT INTO vehicles (make, model, category, price, quantity) VALUES ('Toyota', 'Camry', 'Sedan', 25000.00, 5) RETURNING id"
    );
    vehicleId = vRes.rows[0].id;

    const adminRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['admin-put@example.com', 'hashedpassword', 'admin']
    );
    adminToken = jwt.sign(adminRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');

    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user-put@example.com', 'hashedpassword', 'user']
    );
    userToken = jwt.sign(userRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should successfully update vehicle details if user is an admin', async () => {
    const updatedData = {
      make: 'Toyota',
      model: 'Camry Hybrid',
      category: 'Sedan',
      price: 28000.00,
      quantity: 4,
    };

    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body.model).toBe('Camry Hybrid');
    expect(Number(res.body.price)).toBe(28000.00);

    const dbRes = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
    expect(dbRes.rows[0].model).toBe('Camry Hybrid');
  });

  it('should return 403 Forbidden if user is not an admin', async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 });

    expect(res.status).toBe(403);
  });

  it('should return 404 if vehicle does not exist', async () => {
    const res = await request(app)
      .put('/api/vehicles/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/vehicles/:id/purchase', () => {
  let userToken: string;
  let vehicleId: number;
  let outOfStockVehicleId: number;

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE purchases, vehicles CASCADE');
    const vRes1 = await pool.query(
      "INSERT INTO vehicles (make, model, category, price, quantity) VALUES ('Toyota', 'Camry', 'Sedan', 25000.00, 5) RETURNING id"
    );
    vehicleId = vRes1.rows[0].id;

    const vRes2 = await pool.query(
      "INSERT INTO vehicles (make, model, category, price, quantity) VALUES ('Honda', 'Civic', 'Sedan', 22000.00, 0) RETURNING id"
    );
    outOfStockVehicleId = vRes2.rows[0].id;

    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user-purchase@example.com', 'hashedpassword', 'user']
    );
    userToken = jwt.sign(userRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should successfully purchase a vehicle, decreasing its quantity and recording purchase', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('successfully');
    expect(res.body.vehicle.quantity).toBe(4);

    // Verify quantity in DB
    const vDb = await pool.query('SELECT quantity FROM vehicles WHERE id = $1', [vehicleId]);
    expect(vDb.rows[0].quantity).toBe(4);

    // Verify purchase log in DB
    const pDb = await pool.query('SELECT * FROM purchases WHERE vehicle_id = $1', [vehicleId]);
    expect(pDb.rows.length).toBe(1);
  });

  it('should return 400 Bad Request if vehicle is out of stock', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${outOfStockVehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('out of stock');
  });
});

describe('POST /api/vehicles/:id/restock', () => {
  let adminToken: string;
  let userToken: string;
  let vehicleId: number;

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE purchases, vehicles CASCADE');
    const vRes = await pool.query(
      "INSERT INTO vehicles (make, model, category, price, quantity) VALUES ('Toyota', 'Camry', 'Sedan', 25000.00, 5) RETURNING id"
    );
    vehicleId = vRes.rows[0].id;

    const adminRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['admin-restock@example.com', 'hashedpassword', 'admin']
    );
    adminToken = jwt.sign(adminRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');

    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user-restock@example.com', 'hashedpassword', 'user']
    );
    userToken = jwt.sign(userRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should successfully restock a vehicle if user is an admin', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(15);

    const dbRes = await pool.query('SELECT quantity FROM vehicles WHERE id = $1', [vehicleId]);
    expect(dbRes.rows[0].quantity).toBe(15);
  });

  it('should return 403 Forbidden if user is not an admin', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(403);
  });

  it('should return 400 Bad Request if restock quantity is invalid', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: -3 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  let adminToken: string;
  let userToken: string;
  let vehicleId: number;

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE purchases, vehicles CASCADE');
    const vRes = await pool.query(
      "INSERT INTO vehicles (make, model, category, price, quantity) VALUES ('Toyota', 'Camry', 'Sedan', 25000.00, 5) RETURNING id"
    );
    vehicleId = vRes.rows[0].id;

    const adminRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['admin-delete@example.com', 'hashedpassword', 'admin']
    );
    adminToken = jwt.sign(adminRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');

    const userRes = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      ['user-delete@example.com', 'hashedpassword', 'user']
    );
    userToken = jwt.sign(userRes.rows[0], process.env.JWT_SECRET || 'testsecretjwtkey');
  });

  it('should successfully delete a vehicle if user is an admin', async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');

    const dbRes = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
    expect(dbRes.rows.length).toBe(0);
  });

  it('should return 403 Forbidden if user is not an admin', async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 if vehicle does not exist', async () => {
    const res = await request(app)
      .delete('/api/vehicles/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

