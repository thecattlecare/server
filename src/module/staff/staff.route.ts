import express from 'express';
import { StaffController } from './staff.controller';
import { authenticateRequest, authorizeAdmin } from '../auth/auth.middleware';

const router = express.Router();
const controller = new StaffController();

// ============= IMPORTANT: Put specific routes BEFORE dynamic routes =============

// Summary route (specific)
router.get('/summary', authenticateRequest, controller.getStaffSummary);

// Role Management routes (specific)
router.get('/roles/all', authenticateRequest, authorizeAdmin, controller.getAllRoles);
router.post('/roles', authenticateRequest, authorizeAdmin, controller.addRole);
router.put('/roles', authenticateRequest, authorizeAdmin, controller.updateRole);
router.delete('/roles/:name', authenticateRequest, authorizeAdmin, controller.deleteRole);

// Payment routes (specific)
router.get('/payments', authenticateRequest, controller.getAllPayments);
router.post('/payments', authenticateRequest, authorizeAdmin, controller.createMonthlyPayment);
router.put('/payments/:id', authenticateRequest, authorizeAdmin, controller.updateMonthlyPayment);
router.delete('/payments/:id', authenticateRequest, authorizeAdmin, controller.deleteMonthlyPayment);

// Staff CRUD - Dynamic routes (MUST come LAST)
router.get('/:staffId/payments', authenticateRequest, controller.getStaffPayments);
router.post('/', authenticateRequest, authorizeAdmin, controller.createStaff);
router.get('/', authenticateRequest, controller.getAllStaff);
router.get('/:id', authenticateRequest, controller.getStaffById);
router.put('/:id', authenticateRequest, authorizeAdmin, controller.updateStaff);
router.put('/:id/salary', authenticateRequest, authorizeAdmin, controller.updateSalary);
router.delete('/:id', authenticateRequest, authorizeAdmin, controller.deleteStaff);

export default router;