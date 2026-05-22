import { Router } from 'express';
import { getInvoiceByAuction } from '../controller/invoiceController';

const router = Router();

// GET /api/invoice/:auctionId
router.get('/:auctionId', getInvoiceByAuction);

export default router;