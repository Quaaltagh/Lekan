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
} from '../controller/auctionController';

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
router.get('/seller/:sellerId', getAuctionsBySeller);

// GET  /api/auctions/seller/:sellerId/bidding-status
router.get('/seller/:sellerId/bidding-status', getSellerBiddingStatus);

// POST /api/auctions/seller/:sellerId
router.post('/seller/:sellerId', createAuction);

// PUT    /api/auctions/seller/:sellerId/:id
router.put('/seller/:sellerId/:id', updateAuction);

// DELETE /api/auctions/seller/:sellerId/:id
router.delete('/seller/:sellerId/:id', deleteAuction);

export default router;