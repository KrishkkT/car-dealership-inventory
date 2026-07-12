import request from 'supertest';
import app from '../src/app';
import { pool } from './setup';

describe('POST /api/auth/register', () => {
  it('should successfully register a new user and return user details (without password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('user@example.com');
    expect(res.body).not.toHaveProperty('password');

    // Verify database entry
    const dbRes = await pool.query('SELECT * FROM users WHERE email = $1', ['user@example.com']);
    expect(dbRes.rows.length).toBe(1);
    expect(dbRes.rows[0].email).toBe('user@example.com');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Register a test user for login tests
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      ['user@example.com', hashedPassword]
    );
  });

  it('should successfully log in a user and return a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    
    const token = res.body.token;
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT structure
  });

  it('should return 401 for incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });
});

