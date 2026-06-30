import { Types } from 'mongoose';
import webpush from 'web-push';
import { User } from '../auth/auth.model';
import {
  INotificationDocument,
  Notification,
  NotificationReceipt,
} from './notification.model';
import { PushSubscription } from './push-subscription.model';
import {
  CreateNotificationInput,
  NotificationListItem,
} from './notification.types';
import { broadcastNotificationToUsers } from '../../utils/notifications';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:thecattlecare@gmail.com';

let webPushConfigured = false;

const configureWebPush = () => {
  if (webPushConfigured || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return;
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  webPushConfigured = true;
};

export class NotificationService {
  private toListItem(
    notification: INotificationDocument,
    isViewed: boolean,
    viewedAt?: Date
  ): NotificationListItem {
    return {
      _id: notification._id.toString(),
      type: notification.type,
      direction: notification.direction,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
      isViewed,
      viewedAt: viewedAt?.toISOString(),
    };
  }

  private async resolveTargetUserIds(input: CreateNotificationInput): Promise<string[]> {
    if (input.recipientId) {
      return [input.recipientId];
    }

    const audience = input.audience || 'all';
    const filter: Record<string, unknown> = { isActive: true };

    if (audience === 'admin') {
      filter.role = 'admin';
    } else if (audience === 'user') {
      filter.role = 'user';
    }

    const users = await User.find(filter).select('_id').lean();
    return users.map((user) => String(user._id));
  }

  private async sendWebPush(userIds: string[], notification: INotificationDocument) {
    configureWebPush();

    if (!webPushConfigured || userIds.length === 0) {
      return;
    }

    const subscriptions = await PushSubscription.find({
      userId: { $in: userIds.map((id) => new Types.ObjectId(id)) },
    }).lean();

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: 'CattleCare',
      message: notification.message,
      type: notification.type,
      direction: notification.direction,
      notificationId: notification._id.toString(),
      url: '/admin/notifications',
    });

    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys,
            },
            payload
          );
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: subscription._id });
          }
          console.error('Web push failed:', error?.message || error);
        }
      })
    );
  }

  async createAndBroadcast(input: CreateNotificationInput): Promise<INotificationDocument | null> {
    if (input.dedupeKey) {
      const existing = await Notification.findOne({ dedupeKey: input.dedupeKey }).lean();
      if (existing) {
        return null;
      }
    }

    const notification = await Notification.create({
      type: input.type,
      direction: input.direction,
      message: input.message,
      metadata: input.metadata,
      dedupeKey: input.dedupeKey,
      audience: input.audience || 'all',
      recipientId: input.recipientId ? new Types.ObjectId(input.recipientId) : undefined,
    });

    const targetUserIds = await this.resolveTargetUserIds(input);

    if (targetUserIds.length > 0) {
      await NotificationReceipt.insertMany(
        targetUserIds.map((userId) => ({
          notificationId: notification._id,
          userId: new Types.ObjectId(userId),
          isViewed: false,
        })),
        { ordered: false }
      ).catch((error) => {
        if (error?.code !== 11000) {
          throw error;
        }
      });
    }

    const payload = {
      _id: notification._id.toString(),
      id: notification._id.toString(),
      direction: notification.direction,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
    };

    broadcastNotificationToUsers(input.type, payload, targetUserIds);
    await this.sendWebPush(targetUserIds, notification);

    return notification;
  }

  async listForUser(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean; type?: string } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (options.unreadOnly) {
      match.isViewed = false;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'notifications',
          localField: 'notificationId',
          foreignField: '_id',
          as: 'notification',
        },
      },
      { $unwind: '$notification' },
    ];

    if (options.type) {
      pipeline.push({ $match: { 'notification.type': options.type } });
    }

    pipeline.push(
      { $sort: { 'notification.createdAt': -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      }
    );

    const [result] = await NotificationReceipt.aggregate(pipeline);
    const rows = result?.data || [];
    const total = result?.total?.[0]?.count || 0;

    const data: NotificationListItem[] = rows.map((row: any) =>
      this.toListItem(row.notification, row.isViewed, row.viewedAt)
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getUnreadCount(userId: string) {
    return NotificationReceipt.countDocuments({
      userId: new Types.ObjectId(userId),
      isViewed: false,
    });
  }

  async markAsViewed(userId: string, notificationId: string) {
    const receipt = await NotificationReceipt.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        notificationId: new Types.ObjectId(notificationId),
      },
      { isViewed: true, viewedAt: new Date() },
      { new: true }
    ).lean();

    if (!receipt) {
      return null;
    }

    return { notificationId, isViewed: true };
  }

  async markAllAsViewed(userId: string) {
    const result = await NotificationReceipt.updateMany(
      { userId: new Types.ObjectId(userId), isViewed: false },
      { isViewed: true, viewedAt: new Date() }
    );

    return { modifiedCount: result.modifiedCount || 0 };
  }

  async savePushSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ) {
    const record = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: new Types.ObjectId(userId),
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return record;
  }

  async removePushSubscription(userId: string, endpoint: string) {
    await PushSubscription.deleteOne({
      userId: new Types.ObjectId(userId),
      endpoint,
    });
  }

  getVapidPublicKey() {
    return VAPID_PUBLIC_KEY || null;
  }
}

export const notificationService = new NotificationService();

export async function createAndBroadcastNotification(input: CreateNotificationInput) {
  return notificationService.createAndBroadcast(input);
}
