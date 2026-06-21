import cron from 'node-cron';
import { HealthRepository } from '../module/health/health.repository';
import { TaskRepository } from '../module/task/task.repository';
import { CattleRepository } from '../module/cattle/cattle.repository';
import { Staff } from '../module/staff/staff.model';
import { Task } from '../module/task/task.model';
import { Animal } from '../module/cattle/cattle.model';
import { broadcastNotification } from '../utils/notifications';

const healthRepo = new HealthRepository();
const taskRepo = new TaskRepository();
const cattleRepo = new CattleRepository();

// In-memory recently-notified caches to avoid duplicate blasts
const notifiedVaccinations = new Set<string>();
const notifiedCalvings = new Set<string>();
const notifiedTaskDue = new Set<string>();
const notifiedDailyGoals = new Set<string>();

export function initializeNotificationSchedulers() {
  // Run every 15 minutes to check near-term vaccinations and task due items
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const eightHours = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      // Vaccinations: find scheduled within next 8 hours
      const upcoming = await healthRepo.listUpcomingVaccinations(1);
      for (const vac of upcoming) {
        const scheduled = new Date(vac.scheduledAt as any);
        if (scheduled >= now && scheduled <= eightHours) {
          const key = `vac-${vac._id}`;
          if (!notifiedVaccinations.has(key)) {
            notifiedVaccinations.add(key);
            broadcastNotification('vaccination-upcoming', {
              id: key,
              direction: 'neutral',
              message: `A scheduled vaccination ${vac.vaccineName} is upcoming on ${new Date(vac.scheduledAt as any).toLocaleDateString()}. ${Math.max(0, Math.round((scheduled.getTime() - now.getTime()) / (60 * 60 * 1000)))} hour(s) remaining.`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      // Task due soon: tasks with endDate within next hour
      const oneHour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const dueTasks = await Task.find({
        type: 'once',
        isCompleted: false,
        endDate: { $gte: now, $lte: oneHour },
      }).lean();

      for (const t of dueTasks) {
        const key = `task-due-${t._id}`;
        if (!notifiedTaskDue.has(key)) {
          notifiedTaskDue.add(key);
          broadcastNotification('task', {
            id: `task-due-${t._id}`,
            direction: 'neutral',
            message: `Task "${t.title}" is due within the next hour. Please complete it before the deadline.`,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Calving / breeding related: animals with calvingDate within next 24 hours
      const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const calvingAnimals = await Animal.find({
        calvingDate: { $gte: now, $lte: dayAhead },
        isActive: true,
      }).lean();

      for (const a of calvingAnimals) {
        const key = `calving-${a._id}`;
        if (!notifiedCalvings.has(key)) {
          notifiedCalvings.add(key);
          broadcastNotification('calving', {
            id: `calving-${a._id}`,
            direction: 'neutral',
            message: `Animal ${a.name} has a calving date of ${new Date(a.calvingDate as any).toLocaleDateString()}, which is within the next 24 hours. Please make necessary preparations.`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('notifications.scheduler (15m) failed:', err);
    }
  });

  // Daily check for users with unfulfilled daily goals (runs at 20:00)
  // cron.schedule('0 20 * * *', async () => {
  //   try {
  //     const staff = await Staff.find({ status: 'Active' }).lean();
  //     for (const s of staff) {
  //       const stats = await taskRepo.getTaskStatsForUser(String(s._id));
  //       if (stats.totalDailyTasks > 0 && stats.completedDaily < stats.totalDailyTasks) {
  //         const key = `daily-goals-${s._id}-${new Date().toDateString()}`;
  //         if (!notifiedDailyGoals.has(key)) {
  //           broadcastNotification('goals', {
  //             id: `daily-goals-${s._id}-${new Date().toDateString()}`,
  //             direction: 'neutral',
  //             message: `Staff member has ${stats.completedDaily} of ${stats.totalDailyTasks} daily tasks completed. ${stats.totalDailyTasks - stats.completedDaily} task(s) still pending before end of day.`,
  //             createdAt: new Date().toISOString(),
  //           });
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.error('notifications.scheduler (daily) failed:', err);
  //   }
  // });

  console.log('✓ Notification schedulers initialized');
}

export default initializeNotificationSchedulers;
