import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { notificationQuerySchema, pushSubscribeSchema } from './notification.types';
import { ApiResponse } from '../../utils/api-response';
import { ApiError } from '../../utils/api-error';
import { idParamSchema } from '../../utils/validation';

export class NotificationController {
  private service = new NotificationService();

  list = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const query = notificationQuerySchema.parse(req.query);
    const result = await this.service.listForUser(userId, query);

    return res.status(200).json(
      ApiResponse.success('Notifications fetched successfully', result.data, result.pagination)
    );
  };

  unreadCount = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const count = await this.service.getUnreadCount(userId);
    return res.status(200).json(
      ApiResponse.success('Unread count fetched successfully', { count })
    );
  };

  markViewed = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const { id } = idParamSchema.parse(req.params);
    const result = await this.service.markAsViewed(userId, id);

    if (!result) {
      throw ApiError.NOT_FOUND('Notification not found');
    }

    return res.status(200).json(ApiResponse.success('Notification marked as viewed', result));
  };

  markAllViewed = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const result = await this.service.markAllAsViewed(userId);
    return res.status(200).json(ApiResponse.success('All notifications marked as viewed', result));
  };

  subscribePush = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const subscription = pushSubscribeSchema.parse(req.body);
    const record = await this.service.savePushSubscription(userId, subscription);

    return res.status(201).json(
      ApiResponse.success('Push subscription saved successfully', record)
    );
  };

  unsubscribePush = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const endpoint = req.body?.endpoint;
    if (!endpoint || typeof endpoint !== 'string') {
      throw ApiError.BAD_REQUEST('Push subscription endpoint is required');
    }

    await this.service.removePushSubscription(userId, endpoint);
    return res.status(200).json(ApiResponse.success('Push subscription removed successfully'));
  };

  getVapidPublicKey = async (_req: Request, res: Response) => {
    const publicKey = this.service.getVapidPublicKey();
    return res.status(200).json(
      ApiResponse.success('VAPID public key fetched successfully', { publicKey })
    );
  };
}
