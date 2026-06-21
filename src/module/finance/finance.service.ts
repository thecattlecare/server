// src/module/finance/finance.service.ts
import { Income, Expense, Salary, IIncome, IExpense, ISalary } from './finance.model';
import mongoose from 'mongoose';

export class FinanceService {
  // ============ INCOME ============
  async addIncome(data: Partial<IIncome>): Promise<IIncome> {
    const income = new Income(data);
    return await income.save();
  }

  async getIncomeHistory(
    startDate?: Date,
    endDate?: Date,
    source?: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<{ data: IIncome[]; total: number }> {
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    
    if (source) filter.source = source;

    const [data, total] = await Promise.all([
      Income.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('cattleId', 'name tagNumber')
        .populate('milkSaleId', 'quantity amount')
        .lean(),
      Income.countDocuments(filter),
    ]);

    return { data, total };
  }

  async getTotalIncome(startDate?: Date, endDate?: Date): Promise<number> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const result = await Income.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getIncomeBySource(startDate?: Date, endDate?: Date): Promise<any[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    return await Income.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  async updateIncome(id: string, data: Partial<IIncome>): Promise<IIncome | null> {
    return await Income.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  // ============ EXPENSE ============
  async addExpense(data: Partial<IExpense>): Promise<IExpense> {
    const expense = new Expense(data);
    return await expense.save();
  }

  async updateExpense(id: string, data: Partial<IExpense>): Promise<IExpense | null> {
    return await Expense.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async getExpenseHistory(
    startDate?: Date,
    endDate?: Date,
    category?: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<{ data: IExpense[]; total: number }> {
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    
    if (category) filter.category = category;

    const [data, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return { data, total };
  }

  async getTotalExpense(startDate?: Date, endDate?: Date): Promise<number> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const result = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getExpenseByCategory(startDate?: Date, endDate?: Date): Promise<any[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    return await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  // ============ SALARY ============
  async addSalary(data: Partial<ISalary>): Promise<ISalary> {
    const salary = new Salary(data);
    return await salary.save();
  }

  async getSalaryHistory(
    staffId?: string,
    month?: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<{ data: ISalary[]; total: number }> {
    const filter: any = {};
    if (staffId) filter.staffId = staffId;
    if (month) filter.month = month;

    const [data, total] = await Promise.all([
      Salary.find(filter)
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('staffId', 'fullName role currentSalary')
        .lean(),
      Salary.countDocuments(filter),
    ]);

    return { data, total };
  }

  async getTotalSalary(startDate?: Date, endDate?: Date): Promise<number> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = startDate;
      if (endDate) filter.paymentDate.$lte = endDate;
    }

    const result = await Salary.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$netAmount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async getSalaryByMonth(): Promise<any[]> {
    return await Salary.aggregate([
      {
        $group: {
          _id: '$month',
          total: { $sum: '$netAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }
  // Add to FinanceService class in finance.service.ts

// ============ DELETE METHODS ============
async deleteIncome(id: string): Promise<boolean> {
  const result = await Income.findByIdAndDelete(id);
  return !!result;
}

async deleteExpense(id: string): Promise<boolean> {
  const result = await Expense.findByIdAndDelete(id);
  return !!result;
}

async deleteSalary(id: string): Promise<boolean> {
  const result = await Salary.findByIdAndDelete(id);
  return !!result;
}

  // ============ PROFIT & LOSS ============
  async getProfitLoss(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueBySource: any[];
    expensesByCategory: any[];
  }> {
    const [totalRevenue, totalExpenses, revenueBySource, expensesByCategory] = await Promise.all([
      this.getTotalIncome(startDate, endDate),
      this.getTotalExpense(startDate, endDate),
      this.getIncomeBySource(startDate, endDate),
      this.getExpenseByCategory(startDate, endDate),
    ]);

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueBySource,
      expensesByCategory,
    };
  }

  async getSummary(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpense: number;
    totalSalary: number;
    netProfit: number;
  }> {
    const [totalIncome, totalExpense, totalSalary] = await Promise.all([
      this.getTotalIncome(startDate, endDate),
      this.getTotalExpense(startDate, endDate),
      this.getTotalSalary(startDate, endDate),
    ]);

    return {
      totalIncome,
      totalExpense,
      totalSalary,
      netProfit: totalIncome - totalExpense - totalSalary,
    };
  }
}