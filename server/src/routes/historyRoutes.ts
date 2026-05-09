import { Router } from 'express';
import { getBidHistory } from '../controller/historyController';

const router = Router();

// GET /api/history/:userId?search=&status=Won&startDate=&endDate=&page=1&limit=10
router.get('/:userId', getBidHistory);

export default router;