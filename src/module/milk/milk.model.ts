import mongoose, { Schema, Document } from 'mongoose';

export interface IMilk extends Document {
  cattleId: mongoose.Types.ObjectId;
  amount: number;
  shift: 'Morning' | 'Evening';
  date: Date;
  recordedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilkSchema = new Schema<IMilk>(
  {
    cattleId: {
      type: Schema.Types.ObjectId,
      ref: 'Animal',
      required: [true, 'Cattle ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Milk amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening'],
      required: [true, 'Shift is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate entries for same cattle, shift, and date
MilkSchema.index({ cattleId: 1, shift: 1, date: 1 }, { unique: true });

export const Milk = mongoose.model<IMilk>('Milk', MilkSchema);