import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ReportsController } from './reports.controller';

const router = Router();
const controller = new ReportsController();

router.get('/milk-production', asyncHandler(controller.getMilkProductionReport));
router.get('/milk-inventory', asyncHandler(controller.getMilkInventoryReport));
router.get('/animals', asyncHandler(controller.getAnimalReport));
router.get('/health', asyncHandler(controller.getHealthReport));
router.get('/breeding', asyncHandler(controller.getBreedingReport));
router.get('/financial-summary', asyncHandler(controller.getFinancialSummary));

export default router;