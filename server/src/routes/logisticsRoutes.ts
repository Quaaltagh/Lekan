import { Router } from 'express';
import { getSellerLogistics } from '../controller/logisticsController';

const router = Router();

// GET /api/logistics/seller/:sellerId
router.get('/seller/:sellerId', getSellerLogistics);

export default router;
