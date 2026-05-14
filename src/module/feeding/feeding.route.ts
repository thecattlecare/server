import { Router } from 'express';
import { AsyncHandler } from '../../utils/async-handler';
import { FeedingController } from './feeding.controller';

const router = Router();
const controller = new FeedingController();

router.get('/stocks', AsyncHandler((req, res) => controller.getStocks(req, res)));
router.post('/stocks', AsyncHandler((req, res) => controller.createStock(req, res)));
router.patch('/stocks/:id', AsyncHandler((req, res) => controller.updateStock(req, res)));
router.patch('/stocks/:id/adjust-stock', AsyncHandler((req, res) => controller.adjustStock(req, res)));
router.delete('/stocks/:id', AsyncHandler((req, res) => controller.deleteStock(req, res)));

router.get('/schedules', AsyncHandler((req, res) => controller.getSchedules(req, res)));
router.post('/schedules', AsyncHandler((req, res) => controller.createSchedule(req, res)));
router.patch('/schedules/:id', AsyncHandler((req, res) => controller.updateSchedule(req, res)));
router.patch('/schedules/:id/toggle-status', AsyncHandler((req, res) => controller.toggleScheduleStatus(req, res)));
router.delete('/schedules/:id', AsyncHandler((req, res) => controller.deleteSchedule(req, res)));

router.get('/suppliers', AsyncHandler((req, res) => controller.getSuppliers(req, res)));
router.post('/suppliers', AsyncHandler((req, res) => controller.createSupplier(req, res)));
router.patch('/suppliers/:id', AsyncHandler((req, res) => controller.updateSupplier(req, res)));
router.patch('/suppliers/:id/increment-orders', AsyncHandler((req, res) => controller.incrementOrders(req, res)));
router.delete('/suppliers/:id', AsyncHandler((req, res) => controller.deleteSupplier(req, res)));

export default router;
