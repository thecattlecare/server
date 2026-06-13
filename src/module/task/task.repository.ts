import { BaseRepository } from '../../utils/base-repository';
import { Task } from './task.model';
import { ITask } from './task.types';
import { FilterQuery } from 'mongoose';

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  /**
   * Find tasks by assigned user
   */
  async findByAssignedTo(userId: string): Promise<ITask[]> {
    return this.find({ assignedTo: userId }, { sort: { createdAt: -1 } });
  }

  /**
   * Find tasks assigned by a user
   */
  async findByAssignedBy(userId: string): Promise<ITask[]> {
    return this.find({ assignedBy: userId }, { sort: { createdAt: -1 } });
  }

  /**
   * Find daily tasks for a user
   */
  async findDailyTasksForUser(userId: string | undefined): Promise<ITask[]> {
    return this.find(
      { assignedTo: userId, type: 'daily' },
      { sort: { createdAt: -1 } }
    );
  }

  /**
   * Find pending/in-process tasks (once type with endDate not passed or no completion)
   */
  async findPendingTasks(userId: string | undefined, today: Date = new Date()): Promise<ITask[]> {
    const filter: FilterQuery<ITask> = {
      assignedTo: userId,
      type: 'once',
      isCompleted: false,
      $or: [
        { endDate: { $gte: today } },
        { endDate: { $exists: false } }
      ]
    };

    return this.find(filter, { sort: { endDate: 1, createdAt: -1 } });
  }

  /**
   * Find public tasks visible to all
   */
  async findPublicTasks(): Promise<ITask[]> {
    return this.find(
      { visibility: 'public' },
      { sort: { createdAt: -1 } }
    );
  }

  /**
   * Find accessible tasks for a user (assigned to them or assigned by them, or public)
   */
  async findAccessibleTasks(userId: string | undefined): Promise<ITask[]> {
    const filter: FilterQuery<ITask> = {
      $or: [
        { assignedTo: userId },
        { assignedBy: userId },
        { visibility: 'public' }
      ]
    };

    return this.find(filter, { sort: { createdAt: -1 } });
  }

  /**
   * Update task completion status
   */
  async updateTaskCompletion(taskId: string, isCompleted: boolean): Promise<ITask | null> {
    const now = new Date();
    const updateData: any = { isCompleted };

    if (isCompleted) {
      updateData.lastCompletedAt = now;
      // Add to completion history
      updateData.$push = {
        completionHistory: {
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          completedAt: now
        }
      };
    }

    return this.model.findByIdAndUpdate(taskId, updateData, { new: true });
  }

  /**
   * Reset daily tasks (mark as incomplete)
   */
  async resetDailyTask(taskId: string): Promise<ITask | null> {
    return this.model.findByIdAndUpdate(
      taskId,
      { isCompleted: false },
      { new: true }
    );
  }

  /**
   * Reset all daily tasks for all users
   */
  async resetAllDailyTasks(): Promise<{ modifiedCount: number }> {
    const result = await this.model.updateMany(
      { type: 'daily' },
      { isCompleted: false }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete expired once-type tasks
   */
  async deleteExpiredTasks(beforeDate: Date = new Date()): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany({
      type: 'once',
      endDate: { $lt: beforeDate },
      isCompleted: true
    });

    return { deletedCount: result.deletedCount };
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStatsForUser(userId: string | undefined): Promise<{
    totalDailyTasks: number;
    completedDaily: number;
    totalOnceTasks: number;
    completedOnce: number;
    pendingOnce: number;
  }> {
    const [dailyTasks, dailyCompleted, onceTasks, onceCompleted, oncePending] = await Promise.all([
      this.model.countDocuments({ assignedTo: userId, type: 'daily' }),
      this.model.countDocuments({ assignedTo: userId, type: 'daily', isCompleted: true }),
      this.model.countDocuments({ assignedTo: userId, type: 'once' }),
      this.model.countDocuments({ assignedTo: userId, type: 'once', isCompleted: true }),
      this.model.countDocuments({ assignedTo: userId, type: 'once', isCompleted: false })
    ]);

    return {
      totalDailyTasks: dailyTasks,
      completedDaily: dailyCompleted,
      totalOnceTasks: onceTasks,
      completedOnce: onceCompleted,
      pendingOnce: oncePending
    };
  }
}
