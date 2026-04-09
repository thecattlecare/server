"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milk_controller_1 = require("./milk.controller");
const router = (0, express_1.Router)();
const controller = new milk_controller_1.MilkController();
// Stats routes (specific first)
router.get('/stats/daily', controller.getTodayStats);
router.get('/stats/dashboard', controller.getDashboardStats);
router.get('/stats/bulk', controller.getBulkStats);
// Cattle-specific history
router.get('/cattle/:cattleId/history', controller.getCattleMilkHistory);
// CRUD routes
router.post('/', controller.createMilkRecord);
router.get('/', controller.getMilkRecords);
router.get('/:id', controller.getMilkRecordById);
router.put('/:id', controller.updateMilkRecord);
router.delete('/:id', controller.deleteMilkRecord);
exports.default = router;
