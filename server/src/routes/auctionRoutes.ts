import { Router } from 'express';
import {
  getAuctionsBySeller,
  getAuctionById,
  getActiveAuctions,
  getBuyerAuctions,
  createAuction,
  updateAuction,
  deleteAuction,
  getSellerBiddingStatus,
  completeAuction,
} from '../controller/auctionController';

import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// ── Buyer routes ──────────────────────────────────────────────────────────────
// GET /api/auctions/buyer?search=&grade=&min_price=&max_price=&sort=
router.get('/buyer', getBuyerAuctions);

// GET /api/auctions (semua aktif, tanpa filter)
router.get('/', getActiveAuctions);

// GET /api/auctions/:id
router.get('/:id', getAuctionById);

// ── Seller routes ─────────────────────────────────────────────────────────────
// GET    /api/auctions/seller/:sellerId
router.get('/seller/:sellerId', authenticate, requireRole('nelayan'), getAuctionsBySeller);

// GET  /api/auctions/seller/:sellerId/bidding-status
router.get('/seller/:sellerId/bidding-status', authenticate, requireRole('nelayan'), getSellerBiddingStatus);

// POST /api/auctions/seller/:sellerId
router.post('/seller/:sellerId', authenticate, requireRole('nelayan'), createAuction);

// PUT    /api/auctions/seller/:sellerId/:id
router.put('/seller/:sellerId/:id', authenticate, requireRole('nelayan'), updateAuction);

// DELETE /api/auctions/seller/:sellerId/:id
router.delete('/seller/:sellerId/:id', authenticate, requireRole('nelayan'), deleteAuction);

router.patch('/:id/complete', completeAuction);
export default router;