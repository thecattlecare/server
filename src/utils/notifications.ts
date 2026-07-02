import type { Server as HttpServer, IncomingMessage } from 'http';
import { URL } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '../module/auth/auth.utils';
import { INotification } from './types';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  isAuthenticated?: boolean;
}

let notificationServer: WebSocketServer | null = null;

const authenticateSocket = (req: IncomingMessage): { userId: string; role: string } | null => {
  try {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '', `http://${host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
};

export function initializeNotificationSocket(server: HttpServer) {
  if (notificationServer) return notificationServer;

  notificationServer = new WebSocketServer({
    server,
    path: '/ws/notifications',
  });

  notificationServer.on('connection', (socket: AuthenticatedWebSocket, req) => {
    const auth = authenticateSocket(req);

    if (!auth) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    socket.userId = auth.userId;
    socket.role = auth.role;
    socket.isAuthenticated = true;

    socket.send(
      JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
      })
    );

    socket.on('error', (err) => {
      console.error('notifications: socket error:', err);
    });
  });

  notificationServer.on('error', (err) => {
    console.error('notifications: WebSocketServer error:', err);
  });

  return notificationServer;
}

export function broadcastNotification(type: string, payload: INotification & { _id?: string }) {
  broadcastNotificationToUsers(type, payload, []);
}

export function broadcastNotificationToUsers(
  type: string,
  payload: INotification & { _id?: string },
  userIds: string[]
) {
  if (!notificationServer) {
    console.warn('broadcastNotification: notificationServer not initialized');
    return;
  }

  let message: string;
  try {
    message = JSON.stringify({ type, payload });
  } catch (err) {
    console.error('broadcastNotification: failed to stringify notification', err, payload);
    return;
  }

  const targetUsers = userIds.length > 0 ? new Set(userIds.map(String)) : null;
  let sentCount = 0;

  notificationServer.clients.forEach((client) => {
    const socket = client as AuthenticatedWebSocket;

    try {
      if (client.readyState !== WebSocket.OPEN || !socket.isAuthenticated || !socket.userId) {
        return;
      }

      if (targetUsers && !targetUsers.has(socket.userId)) {
        return;
      }

      client.send(message);
      sentCount++;
    } catch (err) {
      console.error('broadcastNotification: failed to send to client', err);
    }
  });

  console.log(`broadcastNotification: sent to ${sentCount} clients`);
}
