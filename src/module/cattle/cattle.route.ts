import { Router } from 'express';
import { CattleController } from './cattle.controller';
import { AsyncHandler } from '../../utils/async-handler';

const router = Router();
const cattleController = new CattleController();

// router.get('/stats/overview', AsyncHandler((req, res) => cattleController.getCattleStatistics(req, res)));

// CRUD routes
router.post('/', AsyncHandler((req, res) => cattleController.createCattle(req, res)));
router.get('/', AsyncHandler((req, res) => cattleController.getAllCattle(req, res)));

// ID-based routes
router.get('/:id', AsyncHandler((req, res) => cattleController.getCattleById(req, res)));
router.patch('/:id', AsyncHandler((req, res) => cattleController.updateCattle(req, res)));
router.delete('/:id', AsyncHandler((req, res) => cattleController.deleteCattle(req, res)));

export default router;
