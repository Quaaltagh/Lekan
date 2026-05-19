import { Router } from 'express';
import { 
  getSellerLogistics, 
  departShip, 
  arrivedShip, 
  deliveredShip,
  getLogisticsByAuctionId,
  updateDeliveryAddress
} from '../controller/logisticsController';

const router = Router();

// GET /api/logistics/seller/:sellerId
router.get('/seller/:sellerId', getSellerLogistics);

// GET /api/logistics/auction/:auctionId
router.get('/auction/:auctionId', getLogisticsByAuctionId);

// PATCH /api/logistics/:id/address — update delivery address
router.patch('/:id/address', updateDeliveryAddress);

// PATCH /api/logistics/:id/depart   — kapal berangkat (pending → shipped)
router.patch('/:id/depart', departShip);
 
// PATCH /api/logistics/:id/arrived  — kapal tiba (shipped → arrived)
router.patch('/:id/arrived', arrivedShip);
 
// PATCH /api/logistics/:id/delivered — selesai (arrived → delivered)
router.patch('/:id/delivered', deliveredShip);

export default router;
