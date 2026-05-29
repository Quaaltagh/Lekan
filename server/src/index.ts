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
import invoiceRoutes from './routes/invoiceRoutes';
import { authenticate, requireRole } from './middleware/authmiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// ── Public ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);   // login & register tidak butuh token
app.use("/api/auctions",  auctionRoutes); // GET browse = public, POST/PUT/DELETE dihandle di routes
app.use("/api/bids",      bidRoutes);    // GET bid list = public, POST dihandle di routes

// ── Khusus pembeli ────────────────────────────────────────────────────────────
app.use('/api/deposit',       authenticate, requireRole('pembeli'), depositRoutes);
app.use('/api/status-lelang', authenticate, requireRole('pembeli'), statusLelangRoutes);

// ── Khusus nelayan ────────────────────────────────────────────────────────────
// logistics punya endpoint campuran (nelayan: depart/arrived, pembeli: delivered)
// requireRole per-endpoint sudah ada di logisticsRoutes.ts

// ── Butuh login, bebas role ───────────────────────────────────────────────────
app.use("/api/wallet",        authenticate, walletRoutes);
app.use("/api/logistics",     authenticate, logisticsRoutes);
app.use('/api/history',       authenticate, historyRoutes);
app.use('/api/profile',       authenticate, profileRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/invoice',       authenticate, invoiceRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'LEKAN API is running' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  startAuctionExpiryJob(60_000);
});

export default app;