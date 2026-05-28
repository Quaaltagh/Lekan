import { Router } from 'express';
import { getBidsByAuction, submitBid } from '../controller/bidController';
import { getActiveBidsCount } from '../controller/Walletcontroller';
import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// GET  /api/bids/user/:userId/active
router.get('/user/:userId/active', getActiveBidsCount);

// GET  /api/bids/:auctionId
router.get('/:auctionId', getBidsByAuction);

// POST /api/bids/:auctionId
router.post('/:auctionId',authenticate, requireRole('pembeli'), submitBid);

export default router;