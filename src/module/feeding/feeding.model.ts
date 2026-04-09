import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedStock extends Document {
  name: string;
  brand: string;
  stockKg: number;
  unitPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedSchedule extends Document {
  group: string;
  time: string;
  feedType: string;
  status: 'Pending' | 'Done';
  scheduleDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedSupplier extends Document {
  name: string;
  contact: string;
  feedType: string;
  orders: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedStockSchema = new Schema<IFeedStock>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, required: true, trim: true, maxlength: 120 },
    stockKg: { type: Number, required: true, min: 0, default: 0 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FeedStockSchema.index({ name: 1, brand: 1 });

const FeedScheduleSchema = new Schema<IFeedSchedule>(
  {
    group: { type: String, required: true, trim: true, maxlength: 120 },
    time: { type: String, required: true, trim: true, maxlength: 30 },
    feedType: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: ['Pending', 'Done'], default: 'Pending' },
    scheduleDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FeedScheduleSchema.index({ scheduleDate: 1, group: 1, time: 1 });

const FeedSupplierSchema = new Schema<IFeedSupplier>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    contact: { type: String, required: true, trim: true, maxlength: 200 },
    feedType: { type: String, required: true, trim: true, maxlength: 120 },
    orders: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FeedSupplierSchema.index({ name: 1 });

export const FeedStock = mongoose.model<IFeedStock>('FeedStock', FeedStockSchema);
export const FeedSchedule = mongoose.model<IFeedSchedule>('FeedSchedule', FeedScheduleSchema);
export const FeedSupplier = mongoose.model<IFeedSupplier>('FeedSupplier', FeedSupplierSchema);
