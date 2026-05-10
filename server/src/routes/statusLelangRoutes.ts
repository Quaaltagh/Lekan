import { Router } from 'express';
import { getActiveBidStatus } from '../controller/statusLelangController';

const router = Router();

// GET /api/status-lelang/:userId
router.get('/:userId', getActiveBidStatus);

export default router;