import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import publishersRouter from './routes/publishers';
import channelsRouter from './routes/channels';
import metricsRouter from './routes/metrics';
import licensesRouter from './routes/licenses';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/publishers', publishersRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/licenses', licensesRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(port, () => {
  console.log(`🚀 CAFE API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});