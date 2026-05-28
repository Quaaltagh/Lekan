import { Router } from 'express';
import { 
  getSellerLogistics, 
  departShip, 
  arrivedShip, 
  deliveredShip,
  getLogisticsByAuctionId,
  updateDeliveryAddress
} from '../controller/logisticsController';

import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// GET /api/logistics/seller/:sellerId
router.get('/seller/:sellerId',authenticate, requireRole('nelayan'), getSellerLogistics);

// GET /api/logistics/auction/:auctionId
router.get('/auction/:auctionId', authenticate, getLogisticsByAuctionId);

// PATCH /api/logistics/:id/address — update delivery address
router.patch('/:id/address', authenticate, requireRole('pembeli'), updateDeliveryAddress);

// PATCH /api/logistics/:id/depart   — kapal berangkat (pending → shipped)
router.patch('/:id/depart', authenticate, requireRole('nelayan'), departShip);
 
// PATCH /api/logistics/:id/arrived  — kapal tiba (shipped → arrived)
router.patch('/:id/arrived', authenticate, requireRole('nelayan'),arrivedShip);
 
// PATCH /api/logistics/:id/delivered — selesai (arrived → delivered)
router.patch('/:id/delivered', authenticate, requireRole('pembeli'), deliveredShip);

export default router;
