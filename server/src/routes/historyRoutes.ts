import { Router } from 'express';
// 1. Tambahkan import getAuctionHistoryDetail di sini
import { getBidHistory, getAuctionHistoryDetail } from '../controller/historyController';

const router = Router();

// GET /api/history/:userId?search=&status=Won&startDate=&endDate=&page=1&limit=10
router.get('/:userId', getBidHistory);

// Endpoint ini akan menghasilkan URL: /api/history/detail/:auctionId
router.get('/detail/:auctionId', getAuctionHistoryDetail);

export default router;