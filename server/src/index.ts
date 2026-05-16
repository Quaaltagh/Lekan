import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import auctionRoutes from "./routes/auctionRoutes";
import bidRoutes from "./routes/bidRoutes";
import walletRoutes from "./routes/Walletroutes";
import logisticsRoutes from "./routes/logisticsRoutes";
import { startAuctionExpiryJob } from './jobs/auctionExpiry';
import depositRoutes from './routes/depositRoutes';
import historyRoutes from './routes/historyRoutes';
import statusLelangRoutes from './routes/statusLelangRoutes';
import profileRoutes from './routes/profileRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/status-lelang', statusLelangRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'LEKAN API is running' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  startAuctionExpiryJob(60_000);
});

export default app;