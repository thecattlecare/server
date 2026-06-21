import mongoose, { Schema, Document } from 'mongoose';

export interface IMilkSale extends Document {
  amount: number;
  money: number;
  date: Date;
  notes?: string;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MilkSaleSchema = new Schema<IMilkSale>(
  {
    amount: {
      type: Number,
      required: [true, 'Sold milk amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    money: {
      type: Number,
      required: [true, 'Money received is required'],
      min: [0, 'Money cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

MilkSaleSchema.index({ date: 1, createdAt: -1 });

export const MilkSale = mongoose.model<IMilkSale>('MilkSale', MilkSaleSchema);