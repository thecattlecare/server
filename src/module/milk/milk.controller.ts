import { Request, Response } from 'express';
import { MilkService } from './milk.service';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { IMilkCreate, IMilkFilter } from './milk.types';

export class MilkController {
  private service = new MilkService();

  createMilkRecord = asyncHandler(async (req: Request, res: Response) => {
    const data: IMilkCreate = {
      ...req.body
    };
    
    const record = await this.service.createMilkRecord(data);
    return res.status(201).json(ApiResponse.success('Milk record created successfully', record));
  });

  getMilkRecords = asyncHandler(async (req: Request, res: Response) => {
    const filter: IMilkFilter = {
      cattleId: req.query.cattleId as string,
      shift: req.query.shift as 'Morning' | 'Evening',
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const records = await this.service.getMilkRecords(filter);
    return res.status(200).json(ApiResponse.success('Milk records fetched successfully', records));
  });

  getMilkRecordById = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.getMilkRecordById(req.params.id);
    return res.status(200).json(ApiResponse.success('Milk record fetched successfully', record));
  });

  updateMilkRecord = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.updateMilkRecord(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success('Milk record updated successfully', record));
  });

  deleteMilkRecord = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.deleteMilkRecord(req.params.id);
    return res.status(200).json(ApiResponse.success('Milk record deleted successfully', result));
  });

  getTodayStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.service.getTodayStats();
    return res.status(200).json(ApiResponse.success('Today\'s stats fetched successfully', stats));
  });

  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.service.getDashboardStats();
    return res.status(200).json(ApiResponse.success('Dashboard stats fetched successfully', stats));
  });

  getCattleMilkHistory = asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const history = await this.service.getCattleMilkHistory(req.params.cattleId, days);
    return res.status(200).json(ApiResponse.success('Cattle milk history fetched successfully', history));
  });

  getBulkStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json(ApiResponse.error('Start date and end date are required'));
    }

    const records = await this.service.getMilkRecords({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    });

    // Calculate stats
    const totalAmount = records.data.reduce((sum: number, r: any) => sum + r.amount, 0);
    const byShift = records.data.reduce((acc: any, r: any) => {
      acc[r.shift] = (acc[r.shift] || 0) + r.amount;
      return acc;
    }, {});

    return res.status(200).json(ApiResponse.success('Bulk stats fetched successfully', {
      totalAmount,
      byShift,
      recordCount: records.data.length,
      dateRange: { startDate, endDate }
    }));
  });
}