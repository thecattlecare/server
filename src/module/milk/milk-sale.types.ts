import { Types } from 'mongoose';

export interface IMilkSaleBase {
  amount: number;
  money: number;
  date: Date | string;
  notes?: string;
}

export interface IMilkSaleCreate extends IMilkSaleBase {
  recordedBy?: string | Types.ObjectId;
}

export interface IMilkSaleUpdate {
  amount?: number;
  money?: number;
  date?: Date | string;
  notes?: string;
}

export interface IMilkSaleResponse extends IMilkSaleBase {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMilkSaleStats {
  totalAmount: number;
  count: number;
  averagePerRecord?: number;
  totalMoney?: number;
}

export interface IMilkSaleFilter {
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IMilkSaleSummary {
  today: IMilkSaleStats;
  totalAmount: number;
}
