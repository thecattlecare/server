import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { INotification } from './types';

let notificationServer: WebSocketServer | null = null;

export function initializeNotificationSocket(server: HttpServer) {
  if (notificationServer) return notificationServer

  notificationServer = new WebSocketServer({
    server,
    path: '/ws/notifications'
  })

  notificationServer.on('connection', (socket) => {
    socket.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
    }));
  });

  notificationServer.on('connection', (socket) => {
    try {
      console.log('notifications: client connected. total clients =', notificationServer?.clients?.size || 0);
    } catch (err) {
      console.error('notifications: error logging connection:', err);
    }

    socket.on('error', (err) => {
      console.error('notifications: socket error:', err);
    });
  });

  notificationServer.on('error', (err) => {
    console.error('notifications: WebSocketServer error:', err);
  });

  return notificationServer;
}


export function broadcastNotification(type: string, payload: INotification) {
  if (!notificationServer) {
    console.warn('broadcastNotification: notificationServer not initialized');
    return;
  }

  let message: string;
  try {
    message = JSON.stringify({ type, payload, });
  } catch (err) {
    console.error('broadcastNotification: failed to stringify notification', err, payload);
    return;
  }

  let sentCount = 0;
  notificationServer.clients.forEach((client) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    } catch (err) {
      console.error('broadcastNotification: failed to send to client', err);
    }
  });

  console.log(`broadNotification: sent to ${sentCount} clients`);
}
