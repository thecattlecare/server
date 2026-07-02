import 'dotenv/config';
import { createServer } from 'http';
import app from "./app";
import { connectDatabase } from "./config/db";
// import { seedAdminUser } from "./utils/seed-admin";
import { initializeAllSchedulers } from './schedulers/session-cleanup.scheduler';
import { initializeNotificationSocket } from './utils/notifications';

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const PORT = process.env.PORT || 5000;

// Simplified connection for local development
const startLocalServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ MongoDB connected');

    initializeAllSchedulers();

    // Seed admin user
    // await seedAdminUser();
    // console.log('✅ Admin user seeded');

    // Start server
    const httpServer = createServer(app);
    // initializeMilkNotificationSocket(httpServer);
    initializeNotificationSocket(httpServer)


    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket notifications on ws://localhost:${PORT}/ws/notifications`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  startLocalServer();
}

export { startLocalServer };
