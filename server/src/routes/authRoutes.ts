import { Router } from 'express';
import { login, register, logout, getProfileById } from '../controller/authController';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/profile/:userId
router.get('/profile/:userId', getProfileById);

export default router;