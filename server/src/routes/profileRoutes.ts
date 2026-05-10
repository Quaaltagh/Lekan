import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updatePreferences,
  uploadAvatar,
} from '../controller/profileController';

const router = Router();

router.get('/:userId',                getProfile);
router.put('/:userId',                updateProfile);
router.put('/:userId/password',       updatePassword);
router.put('/:userId/preferences',    updatePreferences);
router.post('/:userId/avatar',        uploadAvatar);

export default router;