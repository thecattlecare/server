import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  isBot?: boolean;
  botName?: string;
  isRevoked: boolean;
  revokedAt?: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuthSessionSchema = new Schema<IAuthSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    browser: {
      type: String,
      trim: true,
    },
    os: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      trim: true,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    botName: {
      type: String,
      trim: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AuthSessionSchema.index({ userId: 1, createdAt: -1 });

export const AuthSession = mongoose.model<IAuthSessionDocument>('AuthSession', AuthSessionSchema);
