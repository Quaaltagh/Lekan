import { Router } from 'express';
import {
  getAuctionsBySeller,
  getAuctionById,
  getActiveAuctions,
  createAuction,
  updateAuction,
  deleteAuction,
} from '../controller/auctionController';

const router = Router();

// Publik — untuk halaman buyer browse
// GET /api/auctions
router.get('/', getActiveAuctions);

// GET /api/auctions/:id
router.get('/:id', getAuctionById);

// Seller — semua endpoint pakai sellerId
// GET  /api/auctions/seller/:sellerId
router.get('/seller/:sellerId', getAuctionsBySeller);

// POST /api/auctions/seller/:sellerId
router.post('/seller/:sellerId', createAuction);

// PUT  /api/auctions/seller/:sellerId/:id
router.put('/seller/:sellerId/:id', updateAuction);

// DELETE /api/auctions/seller/:sellerId/:id
router.delete('/seller/:sellerId/:id', deleteAuction);

export default router;