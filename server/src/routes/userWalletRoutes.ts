import { Router } from 'express';
import { getWallet, getTransactions, getActiveBidsCount, deposit } from '../controller/userWalletController';

const router = Router();

// GET  /api/wallet/:userId
router.get('/:userId', getWallet);

// GET  /api/wallet/:userId/transactions
router.get('/:userId/transactions', getTransactions);

// GET  /api/wallet/:userId/active-bids  (dipanggil sebagai /api/bids/user/:userId/active di frontend)
router.get('/:userId/active-bids', getActiveBidsCount);

// POST /api/wallet/:userId/deposit
router.post('/:userId/deposit', deposit);

export default router;