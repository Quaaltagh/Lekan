import { Router } from 'express';
import {
  getNotificationsByUser,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controller/notificationController';
import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

// GET  /api/notifications/:userId
router.get('/:userId', authenticate, getNotificationsByUser);

// GET  /api/notifications/:userId/unread-count
router.get('/:userId/unread-count', authenticate, getUnreadCount);

// POST /api/notifications
router.post('/', authenticate, createNotification);

// PATCH /api/notifications/:userId/mark-all-read
router.patch('/:userId/mark-all-read', authenticate, markAllAsRead);

// PATCH /api/notifications/:userId/:id/read
router.patch('/:userId/:id/read', authenticate, markAsRead);

// DELETE /api/notifications/:userId/:id
router.delete('/:userId/:id', authenticate, deleteNotification);

export default router;
