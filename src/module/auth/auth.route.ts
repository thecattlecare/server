import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateRequest, authorizeAdmin } from './auth.middleware';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
const controller = new AuthController();

router.post('/login', asyncHandler(controller.login));
router.post('/refresh', asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));

router.get('/me', authenticateRequest, asyncHandler(controller.me));
router.get('/sessions', authenticateRequest, asyncHandler(controller.getSessions));
router.delete('/sessions/current', authenticateRequest, asyncHandler(controller.logoutCurrent));
router.delete('/sessions/others', authenticateRequest, asyncHandler(controller.logoutOthers));
router.delete('/sessions/all', authenticateRequest, asyncHandler(controller.logoutAll));
router.delete('/sessions/:id', authenticateRequest, asyncHandler(controller.revokeSession));
router.get('/users', authenticateRequest, asyncHandler(controller.getUsers));
router.post('/users', authenticateRequest, authorizeAdmin, asyncHandler(controller.createUser));

export default router;
