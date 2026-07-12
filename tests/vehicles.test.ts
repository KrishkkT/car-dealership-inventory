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
