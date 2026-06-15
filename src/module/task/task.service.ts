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

    const result = await this.taskRepository.create(taskData as any);
    const bb = result
    const task = await this.taskRepository.findById(result._id, {
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'assignedBy', select: 'name email' }
      ]
    });

    if (!task) {
      // Should not happen, but guard against null from repository
      throw ApiError.NOT_FOUND('Task not found after creation. Refresh the page to get the updated task list or try again.');
    }

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

  private resolveTaskUserId(user?: string | unknown): string | undefined {
    if (!user) return undefined;
    if (typeof user === 'string') return user;
    if (typeof user === 'object' && user !== null && '_id' in user) {
      const id = (user as { _id?: unknown })._id;
      if (id) return String(id);
    }
    return String(user);
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string, userId?: string): Promise<ITask> {
    const task = await this.taskRepository.findById(id, {
      populate: [
        { path: 'assignedTo', select: 'name email' },
        { path: 'assignedBy', select: 'name email' }
      ]
    });

    if (!task) {
      throw ApiError.NOT_FOUND('Task not found');
    }

    // Check access permissions
    if (userId) {
      const assignedToId = this.resolveTaskUserId(task.assignedTo);
      const assignedById = this.resolveTaskUserId(task.assignedBy);
      const hasAccess =
        assignedToId === userId ||
        assignedById === userId ||
        task.visibility === 'public';

      if (!hasAccess) {
        throw ApiError.UNAUTHORIZED('Access denied to this task');
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
    const assignedById = this.resolveTaskUserId(task.assignedBy);
    if (assignedById !== userId) {
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
    const res = await this.getTaskById(updated._id, userId);

    return res;
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

    const assignedToId = this.resolveTaskUserId(task.assignedTo);
    const assignedById = this.resolveTaskUserId(task.assignedBy);

    // Only the assigned person or the assigner can mark as complete
    if (assignedToId !== userId && assignedById !== userId) {
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

    const assignedById = this.resolveTaskUserId(task.assignedBy);

    // Only the user who assigned the task can delete it
    if (assignedById !== userId) {
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
