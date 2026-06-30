import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { AsyncHandler } from '../../utils/async-handler';
import { authenticateRequest } from '../auth/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.get('/vapid-public-key', authenticateRequest, AsyncHandler((req, res) => controller.getVapidPublicKey(req, res)));
router.get('/unread-count', authenticateRequest, AsyncHandler((req, res) => controller.unreadCount(req, res)));
router.patch('/mark-all-viewed', authenticateRequest, AsyncHandler((req, res) => controller.markAllViewed(req, res)));
router.get('/', authenticateRequest, AsyncHandler((req, res) => controller.list(req, res)));
router.patch('/:id/view', authenticateRequest, AsyncHandler((req, res) => controller.markViewed(req, res)));
router.post('/push/subscribe', authenticateRequest, AsyncHandler((req, res) => controller.subscribePush(req, res)));
router.delete('/push/unsubscribe', authenticateRequest, AsyncHandler((req, res) => controller.unsubscribePush(req, res)));

export default router;
