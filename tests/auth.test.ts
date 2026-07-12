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
