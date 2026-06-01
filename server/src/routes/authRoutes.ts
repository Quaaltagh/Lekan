import { Router } from 'express';
import { login, register, logout, getProfileById, requestPasswordReset, resetPassword, verifyOtp, googleUpsert, completeProfile } from '../controller/authController';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/profile/:userId
router.get('/profile/:userId', getProfileById);

// POST /api/auth/request-password-reset
router.post('/request-password-reset', requestPasswordReset);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/google-upsert
router.post('/google-upsert', googleUpsert);
 
// POST /api/auth/complete-profile
router.post('/complete-profile', completeProfile);

export default router;