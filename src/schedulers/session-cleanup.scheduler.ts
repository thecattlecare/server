// src/schedulers/session-cleanup.scheduler.ts
import cron from 'node-cron';
import { AuthSession } from '../module/auth/session.model';
import { initializeTaskSchedulers } from './task-reset.scheduler';

export function initializeSessionCleanup() {
  // Run every day at midnight (you can adjust the schedule)
  cron.schedule('0 0 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled session cleanup...`);

    try {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const result = await AuthSession.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } }, // Expired sessions
          { lastUsedAt: { $lt: tenDaysAgo } } // Inactive for 10 days
        ]
      });

      if (result.deletedCount > 0) {
        console.log(`[${new Date().toISOString()}] Cleaned up ${result.deletedCount} old/expired sessions`);
      } else {
        console.log(`[${new Date().toISOString()}] No old sessions to clean up`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Session cleanup failed:`, error);
    }
  });

  console.log('✓ Session cleanup scheduler initialized (runs daily at midnight)');
}

// Optional: Add more cleanup jobs here
export function initializeAllSchedulers() {
  initializeSessionCleanup();
  initializeTaskSchedulers();
}
