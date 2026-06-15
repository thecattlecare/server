import express from 'express';
import { StaffController } from './staff.controller';

const router = express.Router();
const controller = new StaffController();

// TEMPORARY TEST VERSION - NO AUTH
// Staff CRUD
router.post('/', controller.createStaff);
router.get('/', controller.getAllStaff);
router.get('/summary', controller.getStaffSummary);
router.get('/:id', controller.getStaffById);
router.put('/:id', controller.updateStaff);
router.put('/:id/salary', controller.updateSalary);
router.delete('/:id', controller.deleteStaff);

// Monthly Payments
router.post('/payments', controller.createMonthlyPayment);
router.get('/payments', controller.getAllPayments);
router.get('/:staffId/payments', controller.getStaffPayments);
router.put('/payments/:id', controller.updateMonthlyPayment);
router.delete('/payments/:id', controller.deleteMonthlyPayment);

// Role Management
router.get('/roles/all', controller.getAllRoles);
router.post('/roles', controller.addRole);
router.put('/roles', controller.updateRole);
router.delete('/roles/:name', controller.deleteRole);

export default router;