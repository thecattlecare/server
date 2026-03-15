import { Router } from 'express';
import { MilkController } from './milk.controller';

const router = Router();
const controller = new MilkController();

// Stats routes (specific first)
router.get('/stats/daily', controller.getTodayStats);
router.get('/stats/dashboard', controller.getDashboardStats);
router.get('/stats/bulk', controller.getBulkStats);

// Cattle-specific history
router.get('/cattle/:cattleId/history', controller.getCattleMilkHistory);

// CRUD routes
router.post(
  '/',
  controller.createMilkRecord
);

router.get('/', controller.getMilkRecords);

router.get('/:id', controller.getMilkRecordById);

router.put(
  '/:id',
  controller.updateMilkRecord
);

router.delete(
  '/:id',
  controller.deleteMilkRecord
);

export default router;