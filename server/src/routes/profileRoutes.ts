import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updatePreferences,
  uploadAvatar,
} from '../controller/profileController';
import { authenticate, requireRole } from '../middleware/authmiddleware';

const router = Router();

router.get('/:userId', authenticate, getProfile);
router.put('/:userId', authenticate, updateProfile);
router.put('/:userId/password', authenticate, updatePassword);
router.put('/:userId/preferences', authenticate, updatePreferences);
router.post('/:userId/avatar', authenticate, uploadAvatar);

export default router;