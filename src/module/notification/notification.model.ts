import mongoose, { Document, Schema, Types } from 'mongoose';
import { NotificationAudience, NotificationDirection } from './notification.types';

export interface INotificationDocument extends Document {
  type: string;
  direction: NotificationDirection;
  message: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  audience: NotificationAudience;
  recipientId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationReceiptDocument extends Document {
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  isViewed: boolean;
  viewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    type: { type: String, required: true, trim: true, index: true },
    direction: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
    },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed },
    dedupeKey: { type: String, sparse: true, unique: true },
    audience: {
      type: String,
      enum: ['all', 'admin', 'user'],
      default: 'all',
    },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

const NotificationReceiptSchema = new Schema<INotificationReceiptDocument>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isViewed: { type: Boolean, default: false, index: true },
    viewedAt: { type: Date },
  },
  { timestamps: true }
);

NotificationReceiptSchema.index({ notificationId: 1, userId: 1 }, { unique: true });
NotificationReceiptSchema.index({ userId: 1, isViewed: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
export const NotificationReceipt = mongoose.model<INotificationReceiptDocument>(
  'NotificationReceipt',
  NotificationReceiptSchema
);
