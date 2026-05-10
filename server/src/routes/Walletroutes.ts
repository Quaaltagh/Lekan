import { Router } from 'express';
import {
  getWallet,
  getTransactions,
  withdraw,
  creditWallet,
  addPending,
  releasePending,
  deposit,
  getActiveBidsCount,
} from '../controller/Walletcontroller';

const router = Router();

// GET  /api/wallet/:userId                   — balance + last 10 transactions
router.get('/:userId', getWallet);

// GET  /api/wallet/:userId/transactions      — paginated history (?page=1&limit=20)
router.get('/:userId/transactions', getTransactions);

// GET  /api/wallet/:userId/active-bids       — jumlah bid aktif user
router.get('/:userId/active-bids', getActiveBidsCount);

// POST /api/wallet/:userId/deposit           — Buyer: isi saldo
router.post('/:userId/deposit', deposit);

// POST /api/wallet/:userId/withdraw          — Fisherman: tarik dana
router.post('/:userId/withdraw', withdraw);

// POST /api/wallet/credit                    — Internal: auction payout / refund
router.post('/credit', creditWallet);

// POST /api/wallet/:userId/pending/add       — hold funds as pending
router.post('/:userId/pending/add', addPending);

// POST /api/wallet/:userId/pending/release   — release pending → balance
router.post('/:userId/pending/release', releasePending);

export default router;