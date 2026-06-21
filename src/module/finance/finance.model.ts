// src/module/finance/finance.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  cattleId?: mongoose.Types.ObjectId;
  milkSaleId?: mongoose.Types.ObjectId;
  source: 'milk_sale' | 'cattle_sale' | 'other';
  amount: number;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  referenceNumber?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpense extends Document {
  category: 'feed' | 'medicine' | 'veterinary' | 'equipment' | 'utilities' | 'labor' | 'transport' | 'maintenance' | 'other';
  subCategory?: string;
  amount: number;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  receiptNumber?: string;
  vendor?: string;
  vendorContact?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalary extends Document {
  staffId: mongoose.Types.ObjectId;
  staffName: string;
  staffRole: string;
  baseSalary: number;
  bonuses?: number;
  deductions?: number;
  netAmount: number;
  paymentDate: Date;
  month: string; // Format: YYYY-MM
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  transactionReference?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    cattleId: {
      type: Schema.Types.ObjectId,
      ref: 'Cattle',
    },
    milkSaleId: {
      type: Schema.Types.ObjectId,
      ref: 'MilkSale',
    },
    source: {
      type: String,
      enum: ['milk_sale', 'cattle_sale', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'],
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      enum: ['feed', 'medicine', 'veterinary', 'equipment', 'utilities', 'labor', 'transport', 'maintenance', 'other'],
      required: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'],
      required: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    vendorContact: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SalarySchema = new Schema<ISalary>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    staffRole: {
      type: String,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    month: {
      type: String,
      required: true,
      // Format: YYYY-MM
      match: /^\d{4}-\d{2}$/,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'check', 'other'],
      required: true,
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
IncomeSchema.index({ date: -1 });
IncomeSchema.index({ source: 1 });
IncomeSchema.index({ cattleId: 1 });

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });

SalarySchema.index({ paymentDate: -1 });
SalarySchema.index({ staffId: 1 });
SalarySchema.index({ month: 1 });

export const Income = mongoose.model<IIncome>('Income', IncomeSchema);
export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
export const Salary = mongoose.model<ISalary>('Salary', SalarySchema);