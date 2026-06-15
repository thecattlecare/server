import { Router } from 'express';
import { TaskController } from './task.controller';
import { AsyncHandler } from '../../utils/async-handler';
import { authenticateRequest } from '../auth/auth.middleware';

const router = Router();
const taskController = new TaskController();

/**
 * Create routes for task management
 */

// Statistics route (must be before :id routes to avoid conflicts)
router.get('/stats/overview', authenticateRequest, AsyncHandler((req, res) => taskController.getTaskStats(req, res)));

// Filtered routes for different task views
router.get('/goals/daily', authenticateRequest, AsyncHandler((req, res) => taskController.getDailyGoals(req, res)));
router.get('/process/in-process', authenticateRequest, AsyncHandler((req, res) => taskController.getTasksInProcess(req, res)));
router.get('/public', authenticateRequest, AsyncHandler((req, res) => taskController.getPublicTasks(req, res)));

// CRUD routes
router.post('/', authenticateRequest, AsyncHandler((req, res) => taskController.createTask(req, res)));
router.get('/', authenticateRequest, AsyncHandler((req, res) => taskController.getAllTasks(req, res)));

// ID-based routes
router.get('/:id', authenticateRequest, AsyncHandler((req, res) => taskController.getTaskById(req, res)));
router.patch('/:id', authenticateRequest, AsyncHandler((req, res) => taskController.updateTask(req, res)));
router.patch('/:id/toggle-complete', authenticateRequest, AsyncHandler((req, res) => taskController.toggleTaskCompletion(req, res)));
router.delete('/:id', authenticateRequest, AsyncHandler((req, res) => taskController.deleteTask(req, res)));

export default router;
