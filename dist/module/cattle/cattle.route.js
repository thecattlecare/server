"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cattle_controller_1 = require("./cattle.controller");
const async_handler_1 = require("../../utils/async-handler");
const router = (0, express_1.Router)();
const cattleController = new cattle_controller_1.CattleController();
/**
 * Create routes for cattle management
 */
// Statistics routes (must be before :id routes to avoid conflicts)
router.get('/stats/overview', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.getCattleStatistics(req, res)));
// Filtered routes
router.get('/active', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.getActiveCattle(req, res)));
router.get('/pregnant', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.getPregnantCattle(req, res)));
// Search routes
router.get('/search/:tag', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.searchByTag(req, res)));
router.get('/breed/:breed', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.getCattleByBreed(req, res)));
// Bulk operations
router.post('/bulk', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.createBulkCattle(req, res)));
// CRUD routes
router.post('/', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.createCattle(req, res)));
router.get('/', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.getAllCattle(req, res)));
// ID-based routes
router.get('/:id', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.getCattleById(req, res)));
router.patch('/:id', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.updateCattle(req, res)));
router.delete('/:id', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.deleteCattle(req, res)));
// Reactivate route
router.patch('/:id/reactivate', (0, async_handler_1.AsyncHandler)((req, res) => cattleController.reactivateCattle(req, res)));
exports.default = router;
