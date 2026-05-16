import { Router } from 'express';
import {
  getNotificationsByUser,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controller/notificationController';

const router = Router();

// GET  /api/notifications/:userId
router.get('/:userId', getNotificationsByUser);

// GET  /api/notifications/:userId/unread-count
router.get('/:userId/unread-count', getUnreadCount);

// POST /api/notifications
router.post('/', createNotification);

// PATCH /api/notifications/:userId/mark-all-read
router.patch('/:userId/mark-all-read', markAllAsRead);

// PATCH /api/notifications/:userId/:id/read
router.patch('/:userId/:id/read', markAsRead);

// DELETE /api/notifications/:userId/:id
router.delete('/:userId/:id', deleteNotification);

export default router;
