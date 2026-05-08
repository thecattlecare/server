import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { MilkSaleService } from './milk-sale.service';
import { IMilkSaleCreate, IMilkSaleFilter } from './milk-sale.types';

export class MilkSaleController {
  private service = new MilkSaleService();

  createMilkSale = asyncHandler(async (req: Request, res: Response) => {
    const data: IMilkSaleCreate = {
      ...req.body,
    };

    const record = await this.service.createMilkSale(data);
    return res.status(201).json(ApiResponse.success('Milk sale created successfully', record));
  });

  getMilkSales = asyncHandler(async (req: Request, res: Response) => {
    const filter: IMilkSaleFilter = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const records = await this.service.getMilkSales(filter);
    return res.status(200).json(ApiResponse.success('Milk sales fetched successfully', records));
  });

  getMilkSaleById = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.getMilkSaleById(req.params.id);
    return res.status(200).json(ApiResponse.success('Milk sale fetched successfully', record));
  });

  updateMilkSale = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.updateMilkSale(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success('Milk sale updated successfully', record));
  });

  deleteMilkSale = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.deleteMilkSale(req.params.id);
    return res.status(200).json(ApiResponse.success('Milk sale deleted successfully', result));
  });

  getTodaySaleStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.service.getTodayStats();
    return res.status(200).json(ApiResponse.success('Today\'s milk sales fetched successfully', stats));
  });
}
