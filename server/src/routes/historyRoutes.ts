import { Router } from 'express';
// 1. Tambahkan import getAuctionHistoryDetail di sini
import { getBidHistory, getAuctionHistoryDetail } from '../controller/historyController';
import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// GET /api/history/:userId?search=&status=Won&startDate=&endDate=&page=1&limit=10
router.get('/:userId', authenticate, getBidHistory);

// Endpoint ini akan menghasilkan URL: /api/history/detail/:auctionId
router.get('/detail/:auctionId', authenticate, getAuctionHistoryDetail);

export default router;