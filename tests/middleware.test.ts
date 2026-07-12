import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../src/middleware/authMiddleware';

const testApp = express();
testApp.use(express.json());
testApp.get('/protected', authenticateJWT, (req: any, res) => {
  res.status(200).json({ message: 'Success', user: req.user });
});

describe('JWT Authentication Middleware', () => {
  it('should return 401 Unauthorized if no Authorization header is present', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
  });

  it('should return 401 Unauthorized if Authorization header does not start with Bearer', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'InvalidTokenString');
    expect(res.status).toBe(401);
  });

  it('should return 401 Unauthorized if token is invalid or expired', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.signature');
    expect(res.status).toBe(401);
  });

  it('should allow access and attach user payload to request if token is valid', async () => {
    const userPayload = { id: 1, email: 'user@example.com', role: 'user' };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET || 'testsecretjwtkey');

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Success');
    expect(res.body.user).toMatchObject(userPayload);
  });
});
