import { Types } from 'mongoose';

export interface IMilkBase {
  cattleId: string | Types.ObjectId;
  amount: number;
  shift: 'Morning' | 'Evening';
  date: Date | string;
  notes?: string;
}

export interface IMilkCreate extends IMilkBase {
  recordedBy?: string | Types.ObjectId;
}

export interface IMilkUpdate {
  amount?: number;
  shift?: 'Morning' | 'Evening';
  date?: Date | string;
  notes?: string;
}

export interface IMilkResponse extends IMilkBase {
  _id: string;
  cattle?: {
    _id: string;
    name: string;
    tag?: string;
    rfid?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMilkStats {
  totalAmount: number;
  count: number;
  averagePerRecord?: number;
  byShift?: {
    Morning: number;
    Evening: number;
  };
}

export interface IMilkFilter {
  cattleId?: string;
  shift?: 'Morning' | 'Evening';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IMilkDashboardStats {
  today: IMilkStats;
  week: IMilkStats & { dailyAverage: number };
  month: IMilkStats & { projectedTotal: number };
  topProducers: Array<{
    cattleId: string;
    name: string;
    tag: string;
    totalAmount: number;
    averagePerDay: number;
  }>;
}

export interface IMilkProductionNotification {
  id: string;
  affectedDate: string;
  currentAmount: number;
  previousAmount: number;
  difference: number;
  direction: 'increase' | 'decrease' | 'stable';
  message: string;
  createdAt: string;
}