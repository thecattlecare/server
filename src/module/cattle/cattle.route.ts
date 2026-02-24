import { Router } from 'express';
import { CattleController } from './cattle.controller';
import { AsyncHandler } from '../../utils/async-handler';

const router = Router();
const cattleController = new CattleController();

/**
 * Create routes for cattle management
 */

// Statistics routes (must be before :id routes to avoid conflicts)
router.get('/stats/overview', AsyncHandler((req, res) => cattleController.getCattleStatistics(req, res)));

// Filtered routes
router.get('/active', AsyncHandler((req, res) => cattleController.getActiveCattle(req, res)));
router.get('/pregnant', AsyncHandler((req, res) => cattleController.getPregnantCattle(req, res)));

// Search routes
router.get('/search/:tag', AsyncHandler((req, res) => cattleController.searchByTag(req, res)));
router.get('/breed/:breed', AsyncHandler((req, res) => cattleController.getCattleByBreed(req, res)));

// Bulk operations
router.post('/bulk', AsyncHandler((req, res) => cattleController.createBulkCattle(req, res)));

// CRUD routes
router.post('/', AsyncHandler((req, res) => cattleController.createCattle(req, res)));
router.get('/', AsyncHandler((req, res) => cattleController.getAllCattle(req, res)));

// ID-based routes
router.get('/:id', AsyncHandler((req, res) => cattleController.getCattleById(req, res)));
router.patch('/:id', AsyncHandler((req, res) => cattleController.updateCattle(req, res)));
router.delete('/:id', AsyncHandler((req, res) => cattleController.deleteCattle(req, res)));

// Reactivate route
router.patch('/:id/reactivate', AsyncHandler((req, res) => cattleController.reactivateCattle(req, res)));

export default router;
