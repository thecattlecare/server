import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  fullName: string;
  cnic: string;
  phoneNumber: string;
  address: string;
  joiningDate: Date;
  currentSalary: number;
  role: string;
  status: 'Active' | 'Inactive';
  salaryHistory: ISalaryHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalaryHistory {
  previousSalary: number;
  newSalary: number;
  effectiveDate: Date;
  reason?: string;
}

export interface IMonthlyPayment {
  staffId: mongoose.Types.ObjectId;
  month: string;
  year: number;
  amount: number;
  status: 'Paid' | 'Pending' | 'Partial';
  paymentDate?: Date;
  remarks?: string;
}

const SalaryHistorySchema = new Schema<ISalaryHistory>({
  previousSalary: { type: Number, required: true },
  newSalary: { type: Number, required: true },
  effectiveDate: { type: Date, default: Date.now },
  reason: { type: String }
}, { _id: true });

const StaffSchema = new Schema<IStaff>({
  fullName: { type: String, required: true, trim: true },
  cnic: { type: String, required: true, unique: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  joiningDate: { type: Date, required: true },
  currentSalary: { type: Number, required: true, min: 0 },
  role: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  salaryHistory: [SalaryHistorySchema]
}, { timestamps: true });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);

export const MonthlyPaymentSchema = new Schema<IMonthlyPayment>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
  paymentDate: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

export const MonthlyPayment = mongoose.model<IMonthlyPayment>('MonthlyPayment', MonthlyPaymentSchema);