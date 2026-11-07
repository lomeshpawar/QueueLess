import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import { seedStaff } from './utils/seedStaff.js';
import { getSecurityConfig } from './utils/securityConfig.js';
import { getMongoUri } from './utils/mongoConfig.js';

dotenv.config();

let securityConfig;
let mongoUri;
try {
  securityConfig = getSecurityConfig();
  mongoUri = getMongoUri();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'QueueLess API' }));
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 5000;
try {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  await seedStaff(securityConfig);
  app.listen(port, () => console.log(`QueueLess API running at http://localhost:${port}`));
} catch (error) {
  console.error('Startup failed. Is MongoDB running? Details:', error.message);
  process.exit(1);
}
