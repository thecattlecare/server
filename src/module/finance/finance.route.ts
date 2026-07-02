// src/module/finance/finance.route.ts
import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { authenticateRequest, authorizeAdmin } from '../auth/auth.middleware';

const router = Router();
const controller = new FinanceController();

// Apply auth middleware to all finance routes
router.use(authenticateRequest);

// ============ INCOME ROUTES ============
router.post('/income', controller.addIncome);
router.put('/income/:id', controller.updateIncome);
router.get('/income', controller.getIncomeHistory);
router.get('/income/total', controller.getTotalIncome);

// ============ EXPENSE ROUTES ============
router.post('/expense', controller.addExpense);
router.put('/expense/:id', controller.updateExpense);
router.get('/expense', controller.getExpenseHistory);
router.get('/expense/total', controller.getTotalExpense);
// Add these routes after the existing ones

// ============ DELETE ROUTES ============
router.delete('/income/:id', controller.deleteIncome);
router.delete('/expense/:id', controller.deleteExpense);
router.delete('/salary/:id', controller.deleteSalary);
// ============ SALARY ROUTES ============
router.post('/salary', controller.addSalary);
router.get('/salary', controller.getSalaryHistory);
router.get('/salary/total', controller.getTotalSalary);

// ============ PROFIT & LOSS ROUTES ============
router.get('/profit-loss', controller.getProfitLoss);
router.get('/summary', controller.getSummary);

export default router;