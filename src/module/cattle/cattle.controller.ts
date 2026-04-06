import { Request, Response } from 'express';
import { CattleService } from './cattle.service';
import { createCattleSchema, updateCattleSchema, cattleQuerySchema } from './cattle.types';
import { idParamSchema } from '../../utils/validation';
import { ApiResponse } from '../../utils/api-response';

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
    const validatedData = createCattleSchema.parse(req.body);
    const cattle = await this.cattleService.createCattle(validatedData);
    return ApiResponse.success('Cattle created successfully', 201, cattle)
  }

  /**
   * Get all cattle with pagination
   * GET /cattle
   */
  async getAllCattle(req: Request, res: Response) {
    const validatedQuery = cattleQuerySchema.parse(req.query);
    const result = await this.cattleService.getAllCattle(validatedQuery);
    return ApiResponse.success('Cattle retrieved successfully', 200, result.data, result.pagination);
  }

  /**
   * Get cattle by ID
   * GET /cattle/:id
   */
  async getCattleById(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const cattle = await this.cattleService.getCattleById(id);
    return ApiResponse.success('Cattle retrieved successfully', 200, cattle);
  }

  /**
   * Update cattle
   * PATCH /cattle/:id
   */
  async updateCattle(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const validatedData = updateCattleSchema.parse(req.body);
    const cattle = await this.cattleService.updateCattle(id, validatedData);
    return ApiResponse.success('Cattle updated successfully', 200, cattle)
  }

  /**
   * Delete cattle (soft delete)
   * DELETE /cattle/:id
   */
  async deleteCattle(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const cattle = await this.cattleService.deleteCattle(id);
    return ApiResponse.success('Cattle deleted successfully', 200, cattle)
  }

}
