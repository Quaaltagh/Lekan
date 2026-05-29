import { Router } from 'express';
import { createDeposit, manualConfirmDeposit, getDepositStatus } from '../controller/depositController';
import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// POST /api/deposit/:userId
router.post('/:userId', authenticate, requireRole('pembeli'), createDeposit);

// POST /api/deposit/:userId/confirm/:txId  ← dev/test only
router.post('/:userId/confirm/:txId', manualConfirmDeposit);

// GET  /api/deposit/:userId/status/:txId
router.get('/:userId/status/:txId', getDepositStatus);

export default router;