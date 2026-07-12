import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);

export default app;
