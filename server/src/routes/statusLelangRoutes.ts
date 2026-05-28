import { Router } from 'express';
import { getActiveBidStatus } from '../controller/statusLelangController';
import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// GET /api/status-lelang/:userId
router.get('/:userId', authenticate, requireRole('pembeli'), getActiveBidStatus);

export default router;