import { z } from 'zod';

export type NotificationDirection = 'positive' | 'negative' | 'neutral';
export type NotificationAudience = 'all' | 'admin' | 'user';

export interface CreateNotificationInput {
  type: string;
  direction: NotificationDirection;
  message: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  recipientId?: string;
  audience?: NotificationAudience;
}

export interface NotificationListItem {
  _id: string;
  type: string;
  direction: NotificationDirection;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  isViewed: boolean;
  viewedAt?: string;
}

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  type: z.string().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
