"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milk_controller_1 = require("./milk.controller");
const milk_sale_controller_1 = require("./milk-sale.controller");
const router = (0, express_1.Router)();
const controller = new milk_controller_1.MilkController();
const saleController = new milk_sale_controller_1.MilkSaleController();
// Stats routes (specific first)
router.get('/stats/daily', controller.getTodayStats);
router.get('/stats/summary', controller.getSummaryStats);
router.get('/stats/dashboard', controller.getDashboardStats);
router.get('/stats/production-14days', controller.getLast14DaysProduction);
router.get('/stats/production-12weeks', controller.getLast12WeeksProduction);
router.get('/stats/production-12months', controller.getLast12MonthsProduction);
router.get('/stats/bulk', controller.getBulkStats);
// Cattle-specific history
router.get('/cattle/:cattleId/history', controller.getCattleMilkHistory);
// Sale routes
router.post('/sales', saleController.createMilkSale);
router.get('/sales', saleController.getMilkSales);
router.get('/sales/stats/daily', saleController.getTodaySaleStats);
router.get('/sales/:id', saleController.getMilkSaleById);
router.patch('/sales/:id', saleController.updateMilkSale);
router.delete('/sales/:id', saleController.deleteMilkSale);
// CRUD routes
router.post('/', controller.createMilkRecord);
router.get('/', controller.getMilkRecords);
router.get('/:id', controller.getMilkRecordById);
router.put('/:id', controller.updateMilkRecord);
router.delete('/:id', controller.deleteMilkRecord);
exports.default = router;
