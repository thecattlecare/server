import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { ReportsService } from './reports.service';

export class ReportsController {
  private service = new ReportsService();

  private buildQuery(req: Request) {
    return {
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      animalId: req.query.animalId ? String(req.query.animalId) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
    };
  }

  getMilkProductionReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.service.getMilkProductionReport(this.buildQuery(req));
    return res.status(200).json(ApiResponse.success('Milk production report fetched successfully', report));
  });

  getMilkInventoryReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.service.getMilkInventoryReport(this.buildQuery(req));
    return res.status(200).json(ApiResponse.success('Milk inventory report fetched successfully', report));
  });

  getAnimalReport = asyncHandler(async (_req: Request, res: Response) => {
    const report = await this.service.getAnimalReport();
    return res.status(200).json(ApiResponse.success('Animal report fetched successfully', report));
  });

  getHealthReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.service.getHealthReport(this.buildQuery(req));
    return res.status(200).json(ApiResponse.success('Health report fetched successfully', report));
  });

  getBreedingReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.service.getBreedingReport(this.buildQuery(req));
    return res.status(200).json(ApiResponse.success('Breeding report fetched successfully', report));
  });

  getFinancialSummary = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.service.getFinancialSummary(this.buildQuery(req));
    return res.status(200).json(ApiResponse.success('Financial summary fetched successfully', report));
  });
}