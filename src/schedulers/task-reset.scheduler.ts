import cron from 'node-cron';
import { TaskService } from '../module/task/task.service';

const taskService = new TaskService();

export function initializeTaskSchedulers() {
  // Reset daily tasks every day at 12:00 AM (midnight)
  // Cron pattern: 0 0 * * * (minute hour day month dayOfWeek)
  cron.schedule('0 0 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled task reset (daily tasks)...`);

    try {
      const result = await taskService.resetDailyTasks();

      console.log(`[${new Date().toISOString()}] Reset ${result.modifiedCount} daily tasks`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Daily task reset failed:`, error);
    }
  });

  // Clean up expired one-time tasks every day at 01:00 AM
  // This removes completed one-time tasks that have passed their end date
  cron.schedule('0 1 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled task cleanup (expired tasks)...`);

    try {
      const result = await taskService.cleanupExpiredTasks();

      console.log(`[${new Date().toISOString()}] Cleaned up ${result.deletedCount} expired tasks`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Task cleanup failed:`, error);
    }
  });

  console.log('✓ Task schedulers initialized:');
  console.log('  - Daily task reset: Every day at 00:00 (midnight)');
  console.log('  - Expired task cleanup: Every day at 01:00 AM');
}
