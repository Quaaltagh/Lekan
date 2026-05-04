import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import auctionRoutes from './routes/auctionRoutes';
import { startAuctionExpiryJob } from './jobs/auctionExpiry';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'LEKAN API is running' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);

  // Start auction expiry job
  startAuctionExpiryJob(60_000); // cek tiap 1 menit
});

export default app;