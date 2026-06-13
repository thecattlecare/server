import { TaskRepository } from './task.repository';
import { CreateTaskInput, UpdateTaskInput, ITask } from './task.types';
import { ApiError } from '../../utils/api-error';
import { PaginatedResult, QueryParams } from '../../utils/types';
import { FilterQuery } from 'mongoose';

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  /**
   * Create a new task (Admin only)
   */
  async createTask(data: CreateTaskInput, createdBy: string | undefined): Promise<ITask> {
    // Validate end date for once-type tasks
    if (data.type === 'once' && !data.endDate) {
      throw ApiError.BAD_REQUEST('End date is required for one-time tasks');
    }

    // Validate that end date is after start date
    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw ApiError.BAD_REQUEST('End date must be after start date');
    }

    const taskData = {
      ...data,
      assignedBy: createdBy,
      isCompleted: false,
      completionHistory: []
    };

    const task = await this.taskRepository.create(taskData as any);
    return task;
  }

  /**
   * Get all tasks with pagination and filters
   */
  async getAllTasks(
    queryParams: QueryParams,
    userId: string | undefined,
    isAdmin: boolean
  ): Promise<PaginatedResult<ITask>> {
    const filter: FilterQuery<ITask> = {};

    // Non-admin users can only see tasks assigned to them or assigned by them, or public
    if (!isAdmin) {
      filter.$or = [
        { assignedTo: userId },
        { assignedBy: userId },
        { visibility: 'public' }
      ];
    }

    // Apply filter parameters
    if (queryParams.assignedTo) {
      filter.assignedTo = queryParams.assignedTo;
    }

    if (queryParams.type) {
      filter.type = queryParams.type;
    }

    if (queryParams.visibility) {
      filter.visibility = queryParams.visibility;
    }

    // Status filter
    if (queryParams.status === 'completed') {
      filter.isCompleted = true;
    } else if (queryParams.status === 'pending') {
      filter.isCompleted = false;
    }

    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(50, queryParams.limit || 10);

    // Ensure assigned user names are populated for responses
    const paramsWithPopulate = {
      ...queryParams,
      page,
      limit,
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'assignedBy', select: 'name email' }
      ] as any
    };

    // Use repository's paginated helper which returns the proper PaginatedResult
    return await this.taskRepository.findWithPagination(filter, paramsWithPopulate);
  }

  /**
   * Get daily goals for a user (daily tasks)
   */
  async getDailyGoals(userId: string | undefined): Promise<ITask[]> {
    return this.taskRepository.findDailyTasksForUser(userId);
  }

  /**
   * Get tasks in process (one-time tasks with not passed end date and not completed)
   */
  async getTasksInProcess(userId: string | undefined): Promise<ITask[]> {
    return this.taskRepository.findPendingTasks(userId);
  }

  /**
   * Get public tasks
   */
  async getPublicTasks(): Promise<ITask[]> {
    return this.taskRepository.findPublicTasks();
  }

  /**
   * Get accessible tasks for a user
   */
  async getAccessibleTasks(userId: string | undefined): Promise<ITask[]> {
    return this.taskRepository.findAccessibleTasks(userId);
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string, userId?: string): Promise<ITask> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw ApiError.NOT_FOUND('Task not found');
    }

    // Check access permissions
    if (userId) {
      const hasAccess =
        task.assignedTo === userId ||
        task.assignedBy === userId ||
        task.visibility === 'public';

      if (!hasAccess) {
        throw ApiError.UNAUTHORIZED('You do not have permission to view this task');
      }
    }

    return task;
  }

  /**
   * Update a task (Admin or the one who assigned it)
   */
  async updateTask(
    id: string,
    data: UpdateTaskInput,
    userId: string | undefined
  ): Promise<ITask> {
    const task = await this.getTaskById(id, userId);

    // Only the user who assigned the task can update it
    if (task.assignedBy !== userId) {
      throw ApiError.UNAUTHORIZED('Only the task creator can update it');
    }

    // Validate end date if being changed
    if (data.endDate && data.type !== 'daily') {
      const startDate = data.startDate || task.startDate;
      if (new Date(data.endDate) <= new Date(startDate)) {
        throw ApiError.BAD_REQUEST('End date must be after start date');
      }
    }

    const updated = await this.taskRepository.update(id, { $set: data });

    if (!updated) {
      throw ApiError.NOT_FOUND('Task not found');
    }

    return updated;
  }

  /**
   * Mark task as complete/incomplete
   */
  async toggleTaskCompletion(
    id: string,
    isCompleted: boolean,
    userId: string | undefined
  ): Promise<ITask> {
    const task = await this.getTaskById(id, userId);

    // Only the assigned person or the assigner can mark as complete
    if (task.assignedTo !== userId && task.assignedBy !== userId) {
      throw ApiError.UNAUTHORIZED('You do not have permission to update this task');
    }

    const updated = await this.taskRepository.updateTaskCompletion(id, isCompleted);

    if (!updated) {
      throw ApiError.NOT_FOUND('Task not found');
    }

    return updated;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string, userId: string | undefined): Promise<void> {
    const task = await this.getTaskById(id, userId);

    // Only the user who assigned the task can delete it
    if (task.assignedBy !== userId) {
      throw ApiError.UNAUTHORIZED('Only the task creator can delete it');
    }

    await this.taskRepository.delete(id);
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStats(userId: string | undefined): Promise<{
    totalDailyTasks: number;
    completedDaily: number;
    totalOnceTasks: number;
    completedOnce: number;
    pendingOnce: number;
  }> {
    return this.taskRepository.getTaskStatsForUser(userId);
  }

  /**
   * Reset daily tasks (called by scheduler at 12 AM)
   */
  async resetDailyTasks(): Promise<{ modifiedCount: number }> {
    return this.taskRepository.resetAllDailyTasks();
  }

  /**
   * Clean up expired tasks
   */
  async cleanupExpiredTasks(): Promise<{ deletedCount: number }> {
    return this.taskRepository.deleteExpiredTasks();
  }
}
