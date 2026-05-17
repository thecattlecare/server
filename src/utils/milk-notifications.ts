import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { IMilkProductionNotification } from '../module/milk/milk.types';

let milkNotificationServer: WebSocketServer | null = null;

export function initializeMilkNotificationSocket(server: HttpServer) {
  if (milkNotificationServer) {
    return milkNotificationServer;
  }

  milkNotificationServer = new WebSocketServer({
    server,
    path: '/ws/milk-notifications',
  });

  milkNotificationServer.on('connection', (socket) => {
    socket.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
    }));
  });

  milkNotificationServer.on('connection', (socket) => {
    try {
      console.log('milk-notifications: client connected. total clients =', milkNotificationServer?.clients?.size || 0);
    } catch (err) {
      console.error('milk-notifications: error logging connection:', err);
    }

    socket.on('error', (err) => {
      console.error('milk-notifications: socket error:', err);
    });
  });

  milkNotificationServer.on('error', (err) => {
    console.error('milk-notifications: WebSocketServer error:', err);
  });

  return milkNotificationServer;
}

export function broadcastMilkProductionChange(notification: IMilkProductionNotification) {
  if (!milkNotificationServer) {
    console.warn('broadcastMilkProductionChange: milkNotificationServer not initialized');
    return;
  }

  let message: string;
  try {
    message = JSON.stringify({
      type: 'milk-production-change',
      payload: notification,
    });
  } catch (err) {
    console.error('broadcastMilkProductionChange: failed to stringify notification', err, notification);
    return;
  }

  let sentCount = 0;
  milkNotificationServer.clients.forEach((client) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    } catch (err) {
      console.error('broadcastMilkProductionChange: failed to send to client', err);
    }
  });

  console.log(`broadcastMilkProductionChange: sent to ${sentCount} clients`, notification.affectedDate, 'difference:', notification.difference);
}

// Feed low-stock notification
export interface IFeedLowNotification {
  id: string;
  feedId?: string;
  name: string;
  brand?: string;
  stockKg: number;
  unitPrice?: number;
  threshold: number;
  message: string;
  createdAt: string;
}

export function broadcastFeedStockLow(notification: IFeedLowNotification) {
  if (!milkNotificationServer) return;

  const message = JSON.stringify({
    type: 'feed-stock-low',
    payload: notification,
  });

  milkNotificationServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}