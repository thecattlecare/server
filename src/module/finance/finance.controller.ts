// src/module/finance/finance.controller.ts
import { Request, Response } from 'express';
import { FinanceService } from './finance.service';

const financeService = new FinanceService();

export class FinanceController {
  // ============ INCOME CONTROLLERS ============
  addIncome = async (req: Request, res: Response) => {
    try {
      const incomeData = {
        ...req.body,
        createdBy: req.auth?.userId,
      };
      const income = await financeService.addIncome(incomeData);
      res.status(201).json({
        statusCode: 201,
        data: income,
        message: 'Income added successfully',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to add income',
        success: false
      });
    }
  };

  updateIncome = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const income = await financeService.updateIncome(id, req.body);
      if (!income) {
        return res.status(404).json({
          statusCode: 404,
          data: null,
          message: 'Income not found',
          success: false
        });
      }
      res.json({
        statusCode: 200,
        data: income,
        message: 'Income updated successfully',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to update income',
        success: false
      });
    }
  };

// ============ DELETE METHODS ============
deleteIncome = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await financeService.deleteIncome(id);
    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        data: null,
        message: 'Income record not found',
        success: false
      });
    }
    res.json({
      statusCode: 200,
      data: null,
      message: 'Income deleted successfully',
      success: true
    });
  } catch (error: any) {
    res.status(500).json({
      statusCode: 500,
      data: null,
      message: error.message || 'Failed to delete income',
      success: false
    });
  }
};

deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await financeService.deleteExpense(id);
    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        data: null,
        message: 'Expense record not found',
        success: false
      });
    }
    res.json({
      statusCode: 200,
      data: null,
      message: 'Expense deleted successfully',
      success: true
    });
  } catch (error: any) {
    res.status(500).json({
      statusCode: 500,
      data: null,
      message: error.message || 'Failed to delete expense',
      success: false
    });
  }
};

deleteSalary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await financeService.deleteSalary(id);
    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        data: null,
        message: 'Salary record not found',
        success: false
      });
    }
    res.json({
      statusCode: 200,
      data: null,
      message: 'Salary deleted successfully',
      success: true
    });
  } catch (error: any) {
    res.status(500).json({
      statusCode: 500,
      data: null,
      message: error.message || 'Failed to delete salary',
      success: false
    });
  }
};
  getIncomeHistory = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, source, limit = 100, skip = 0 } = req.query;
      const result = await financeService.getIncomeHistory(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        source as string,
        Number(limit),
        Number(skip)
      );
      res.json({
        statusCode: 200,
        data: result,
        message: 'Income history retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch income history',
        success: false
      });
    }
  };

  getTotalIncome = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const total = await financeService.getTotalIncome(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        statusCode: 200,
        data: { total },
        message: 'Total income retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch total income',
        success: false
      });
    }
  };

  // ============ EXPENSE CONTROLLERS ============
  addExpense = async (req: Request, res: Response) => {
    try {
      const expenseData = {
        ...req.body,
        createdBy: req.auth?.userId,
      };
      const expense = await financeService.addExpense(expenseData);
      res.status(201).json({
        statusCode: 201,
        data: expense,
        message: 'Expense added successfully',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to add expense',
        success: false
      });
    }
  };

  updateExpense = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const expense = await financeService.updateExpense(id, req.body);
      if (!expense) {
        return res.status(404).json({
          statusCode: 404,
          data: null,
          message: 'Expense not found',
          success: false
        });
      }
      res.json({
        statusCode: 200,
        data: expense,
        message: 'Expense updated successfully',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to update expense',
        success: false
      });
    }
  };

  getExpenseHistory = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, category, limit = 100, skip = 0 } = req.query;
      const result = await financeService.getExpenseHistory(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        category as string,
        Number(limit),
        Number(skip)
      );
      res.json({
        statusCode: 200,
        data: result,
        message: 'Expense history retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch expense history',
        success: false
      });
    }
  };

  getTotalExpense = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const total = await financeService.getTotalExpense(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        statusCode: 200,
        data: { total },
        message: 'Total expense retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch total expense',
        success: false
      });
    }
  };

  // ============ SALARY CONTROLLERS ============
  addSalary = async (req: Request, res: Response) => {
    try {
      const salaryData = {
        ...req.body,
        createdBy: req.auth?.userId,
      };
      const salary = await financeService.addSalary(salaryData);
      res.status(201).json({
        statusCode: 201,
        data: salary,
        message: 'Salary added successfully',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to add salary',
        success: false
      });
    }
  };

  getSalaryHistory = async (req: Request, res: Response) => {
    try {
      const { staffId, month, limit = 100, skip = 0 } = req.query;
      const result = await financeService.getSalaryHistory(
        staffId as string,
        month as string,
        Number(limit),
        Number(skip)
      );
      res.json({
        statusCode: 200,
        data: result,
        message: 'Salary history retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch salary history',
        success: false
      });
    }
  };

  getTotalSalary = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const total = await financeService.getTotalSalary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        statusCode: 200,
        data: { total },
        message: 'Total salary retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch total salary',
        success: false
      });
    }
  };

  // ============ PROFIT & LOSS CONTROLLERS ============
  getProfitLoss = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const result = await financeService.getProfitLoss(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        statusCode: 200,
        data: result,
        message: 'Profit & Loss statement retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch profit & loss',
        success: false
      });
    }
  };

  getSummary = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const result = await financeService.getSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({
        statusCode: 200,
        data: result,
        message: 'Financial summary retrieved',
        success: true
      });
    } catch (error: any) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message || 'Failed to fetch summary',
        success: false
      });
    }
  };
}