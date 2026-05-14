import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { seedAdminUser } from '../src/utils/seed-admin';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Global promise for database connection (prevents multiple connections)
let dbConnectionPromise: Promise<void> | null = null;

const ensureDatabaseConnection = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = (async () => {
      try {
        await connectDatabase();
        await seedAdminUser();
        console.log('✅ Database connected successfully');
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        dbConnectionPromise = null;
        throw error;
      }
    })();
  }
  return dbConnectionPromise;
};

// Serverless handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to database for each request (connection pooling handles this efficiently)
    await ensureDatabaseConnection();

    // Pass request to Express app
    await new Promise((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) reject(err);
        resolve(undefined);
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}
