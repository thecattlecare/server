import 'dotenv/config';
import app from "./app";
import { connectDatabase } from "./config/db";
import { seedAdminUser } from "./utils/seed-admin";

const PORT = process.env.PORT || 5000;

// Simplified connection for local development
const startLocalServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ MongoDB connected');

    // Seed admin user
    await seedAdminUser();
    console.log('✅ Admin user seeded');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
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
