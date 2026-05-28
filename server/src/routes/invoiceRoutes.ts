import { Router } from 'express';
import { getInvoiceByAuction } from '../controller/invoiceController';
import { authenticate } from '../middleware/authmiddleware';

const router = Router();

// GET /api/invoice/:auctionId
router.get('/:auctionId', authenticate, getInvoiceByAuction);

export default router;