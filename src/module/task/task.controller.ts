import { Request, Response } from 'express';
import { TaskService } from './task.service';
import {
  createTaskSchema,
  updateTaskSchema,
  markTaskCompleteSchema,
  taskQuerySchema
} from './task.types';
import { idParamSchema } from '../../utils/validation';
import { ApiResponse } from '../../utils/api-response';
import { ApiError } from '../../utils/api-error';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Create a new task
   * POST /tasks
   * Admin only
   */
  async createTask(req: Request, res: Response) {
    try {
      // Check if user is admin (you can add this middleware)
      const validatedData = createTaskSchema.parse(req.body);
      const task = await this.taskService.createTask(validatedData, req.auth?.userId);

      return res.status(201).json(
        ApiResponse.success('Task created successfully', task)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get all tasks with filters
   * GET /tasks
   */
  async getAllTasks(req: Request, res: Response) {
    try {
      const queryParams = taskQuerySchema.parse(req.query);
      const tasks = await this.taskService.getAllTasks(
        queryParams,
        req.auth?.userId,
        req.auth?.role === 'admin'
      );

      // If service returns an object with `data` and `pagination`,
      // pass them to ApiResponse so they appear as top-level fields.
      if (tasks && typeof tasks === 'object' && 'data' in tasks && 'pagination' in tasks) {
        return res.status(200).json(
          ApiResponse.success('Tasks retrieved successfully', (tasks as any).data, (tasks as any).pagination)
        );
      }

      return res.status(200).json(
        ApiResponse.success('Tasks retrieved successfully', tasks)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get daily goals (daily tasks)
   * GET /tasks/goals/daily
   */
  async getDailyGoals(req: Request, res: Response) {
    try {
      const tasks = await this.taskService.getDailyGoals(req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success('Daily goals retrieved successfully', tasks)
      );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get tasks in process
   * GET /tasks/process/in-process
   */
  async getTasksInProcess(req: Request, res: Response) {
    try {
      const tasks = await this.taskService.getTasksInProcess(req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success('Tasks in process retrieved successfully', tasks)
      );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get public tasks
   * GET /tasks/public
   */
  async getPublicTasks(req: Request, res: Response) {
    try {
      const tasks = await this.taskService.getPublicTasks();

      return res.status(200).json(
        ApiResponse.success('Public tasks retrieved successfully', tasks)
      );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get a single task by ID
   * GET /tasks/:id
   */
  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const task = await this.taskService.getTaskById(id, req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success('Task retrieved successfully', task)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Update a task
   * PATCH /tasks/:id
   */
  async updateTask(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await this.taskService.updateTask(id, validatedData, req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success('Task updated successfully', task)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Toggle task completion status
   * PATCH /tasks/:id/toggle-complete
   */
  async toggleTaskCompletion(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { isCompleted } = markTaskCompleteSchema.parse(req.body);
      const task = await this.taskService.toggleTaskCompletion(id, isCompleted, req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success(
          isCompleted ? 'Task marked as complete' : 'Task marked as incomplete',
          task
        )
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Delete a task
   * DELETE /tasks/:id
   */
  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await this.taskService.deleteTask(id, req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success('Task deleted successfully')
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get task statistics for current user
   * GET /tasks/stats/overview
   */
  async getTaskStats(req: Request, res: Response) {
    try {
      const stats = await this.taskService.getTaskStats(req.auth?.userId);

      return res.status(200).json(
        ApiResponse.success('Task statistics retrieved successfully', stats)
      );
    } catch (error: any) {
      throw error;
    }
  }
}
