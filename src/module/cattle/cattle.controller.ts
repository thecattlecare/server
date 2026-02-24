import { Request, Response } from 'express';
import { CattleService } from './cattle.service';
import { createCattleSchema, updateCattleSchema, cattleQuerySchema } from './cattle.types';
import { idParamSchema } from '../../utils/validation';
import { ApiResponse } from '../../utils/api-response';
import { ApiError } from '../../utils/api-error';

export class CattleController {
  private cattleService: CattleService;

  constructor() {
    this.cattleService = new CattleService();
  }

  /**
   * Create new cattle
   * POST /cattle
   */
  async createCattle(req: Request, res: Response) {
    try {
      const validatedData = createCattleSchema.parse(req.body);
      const cattle = await this.cattleService.createCattle(validatedData);

      return res.status(201).json(
        ApiResponse.success('Cattle created successfully', cattle)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Create multiple cattle
   * POST /cattle/bulk
   */
  async createBulkCattle(req: Request, res: Response) {
    try {
      if (!Array.isArray(req.body)) {
        throw ApiError.BAD_REQUEST('Request body must be an array');
      }

      const validatedData = req.body.map((item: any) => createCattleSchema.parse(item));
      const cattle = await this.cattleService.createBulkCattle(validatedData);

      return res.status(201).json(
        ApiResponse.success(`${cattle.length} cattle created successfully`, cattle)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get all cattle with pagination
   * GET /cattle
   */
  async getAllCattle(req: Request, res: Response) {
    try {
      const validatedQuery = cattleQuerySchema.parse(req.query);
      const result = await this.cattleService.getAllCattle(validatedQuery);

      return res.status(200).json({
        success: true,
        message: 'Cattle retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get cattle by ID
   * GET /cattle/:id
   */
  async getCattleById(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const cattle = await this.cattleService.getCattleById(id);

      return res.status(200).json(
        ApiResponse.success('Cattle retrieved successfully', cattle)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST('Invalid cattle ID');
      }
      throw error;
    }
  }

  /**
   * Update cattle
   * PATCH /cattle/:id
   */
  async updateCattle(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const validatedData = updateCattleSchema.parse(req.body);

      const cattle = await this.cattleService.updateCattle(id, validatedData);

      return res.status(200).json(
        ApiResponse.success('Cattle updated successfully', cattle)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Delete cattle (soft delete)
   * DELETE /cattle/:id
   */
  async deleteCattle(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const cattle = await this.cattleService.deleteCattle(id);

      return res.status(200).json(
        ApiResponse.success('Cattle deleted successfully', cattle)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST('Invalid cattle ID');
      }
      throw error;
    }
  }

  /**
   * Reactivate cattle
   * PATCH /cattle/:id/reactivate
   */
  async reactivateCattle(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const cattle = await this.cattleService.reactivateCattle(id);

      return res.status(200).json(
        ApiResponse.success('Cattle reactivated successfully', cattle)
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST('Invalid cattle ID');
      }
      throw error;
    }
  }

  /**
   * Get active cattle
   * GET /cattle/active
   */
  async getActiveCattle(req: Request, res: Response) {
    try {
      const validatedQuery = cattleQuerySchema.parse(req.query);
      const result = await this.cattleService.getActiveCattle(validatedQuery);

      return res.status(200).json({
        success: true,
        message: 'Active cattle retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get pregnant cattle
   * GET /cattle/pregnant
   */
  async getPregnantCattle(req: Request, res: Response) {
    try {
      const validatedQuery = cattleQuerySchema.parse(req.query);
      const result = await this.cattleService.getPregnantCattle(validatedQuery);

      return res.status(200).json({
        success: true,
        message: 'Pregnant cattle retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get cattle by breed
   * GET /cattle/breed/:breed
   */
  async getCattleByBreed(req: Request, res: Response) {
    try {
      const { breed } = req.params;
      if (!breed) {
        throw ApiError.BAD_REQUEST('Breed is required');
      }

      const validatedQuery = cattleQuerySchema.parse(req.query);
      const result = await this.cattleService.getCattleByBreed(breed, validatedQuery);

      return res.status(200).json({
        success: true,
        message: 'Cattle by breed retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw ApiError.BAD_REQUEST(error.errors[0].message);
      }
      throw error;
    }
  }

  /**
   * Get cattle statistics
   * GET /cattle/stats/overview
   */
  async getCattleStatistics(req: Request, res: Response) {
    try {
      const stats = await this.cattleService.getCattleStatistics();

      return res.status(200).json(
        ApiResponse.success('Cattle statistics retrieved successfully', stats)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search cattle by tag
   * GET /cattle/search/:tag
   */
  async searchByTag(req: Request, res: Response) {
    try {
      const { tag } = req.params;
      if (!tag) {
        throw ApiError.BAD_REQUEST('Tag is required');
      }

      const cattle = await this.cattleService.searchByTag(tag);

      if (!cattle) {
        return res.status(404).json(
          ApiResponse.error('Cattle not found')
        );
      }

      return res.status(200).json(
        ApiResponse.success('Cattle found', cattle)
      );
    } catch (error) {
      throw error;
    }
  }
}
