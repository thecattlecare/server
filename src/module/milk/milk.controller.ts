import { Request, Response } from 'express';
import { MilkService } from './milk.service';
import { MilkSaleService } from './milk-sale.service';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { IMilkCreate, IMilkFilter } from './milk.types';
import { broadcastMilkProductionChange } from '../../utils/milk-notifications';

export class MilkController {
  private service = new MilkService();
  private saleService = new MilkSaleService();

  private async broadcastProductionChange(recordDate: Date | string) {
    const notification = await this.service.getProductionChangeNotification(recordDate);

    if (!notification) {
      console.warn('broadcastProductionChange: no notification returned for date', recordDate);
      return;
    }

    if (notification.difference === 0) {
      console.log('broadcastProductionChange: no difference for', notification.affectedDate);
      return;
    }

    try {
      console.log('broadcastProductionChange: broadcasting notification for', notification.affectedDate, 'difference:', notification.difference);
      // broadcastMilkProductionChange is synchronous currently but wrap in Promise.resolve
      await Promise.resolve(broadcastMilkProductionChange(notification));
      console.log('broadcastProductionChange: broadcast completed successfully');
    } catch (error) {
      console.error('broadcastProductionChange: error while broadcasting milk production notification:', error);
      // Rethrow so calling flow can handle/log it properly instead of silently swallowing
      throw error;
    }
  }

  createMilkRecord = asyncHandler(async (req: Request, res: Response) => {
    const data: IMilkCreate = {
      ...req.body
    };

    console.log('createMilkRecord: received payload', {
      cattleId: data.cattleId,
      amount: data.amount,
      shift: data.shift,
      date: data.date,
    });

    const record = await this.service.createMilkRecord(data);

    const recordDate = data.date || record?.date;
    console.log('createMilkRecord: saved record', {
      recordId: (record as any)?._id,
      recordDate,
    });

    if (recordDate) {
      try {
        await this.broadcastProductionChange(recordDate);
      } catch (error) {
        // Do not fail record creation because of notification delivery problems
        console.error('createMilkRecord: broadcast failed after record creation:', error);
      }
    } else {
      console.warn('createMilkRecord: no record date available, broadcast skipped');
    }
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
    const recordDate = req.body?.date || record?.date;
    console.log('updateMilkRecord: updated record', {
      recordId: req.params.id,
      recordDate,
    });

    if (recordDate) {
      try {
        await this.broadcastProductionChange(recordDate);
      } catch (error) {
        console.error('updateMilkRecord: broadcast failed after update:', error);
      }
    }
    return res.status(200).json(ApiResponse.success('Milk record updated successfully', record));
  });

  deleteMilkRecord = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.getMilkRecordById(req.params.id);
    const result = await this.service.deleteMilkRecord(req.params.id);

    console.log('deleteMilkRecord: deleted record', {
      recordId: req.params.id,
      recordDate: record?.date,
    });

    if (record?.date) {
      try {
        await this.broadcastProductionChange(record.date);
      } catch (error) {
        console.error('deleteMilkRecord: broadcast failed after deletion:', error);
      }
    }
    return res.status(200).json(ApiResponse.success('Milk record deleted successfully', result));
  });

  getTodayStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.service.getTodayStats();
    return res.status(200).json(ApiResponse.success('Today\'s stats fetched successfully', stats));
  });

  getSummaryStats = asyncHandler(async (req: Request, res: Response) => {
    const [productionToday, salesToday, totalProduced, totalSold] = await Promise.all([
      this.service.getTodayStats(),
      this.saleService.getTodayStats(),
      this.service.getTotalAmount(),
      this.saleService.getTotalAmount(),
    ]);

    const currentStock = Math.max(totalProduced - totalSold, 0);

    return res.status(200).json(
      ApiResponse.success('Milk summary fetched successfully', {
        productionToday,
        salesToday,
        totalProduced,
        totalSold,
        currentStock,
      })
    );
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

  getLast14DaysProduction = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getLast14DaysProduction();
    return res.status(200).json(ApiResponse.success('Last 14 days production fetched successfully', data));
  });

  getLast12WeeksProduction = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getLast12WeeksProduction();
    return res.status(200).json(ApiResponse.success('Last 12 weeks production fetched successfully', data));
  });

  getLast12MonthsProduction = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getLast12MonthsProduction();
    return res.status(200).json(ApiResponse.success('Last 12 months production fetched successfully', data));
  });

  getSessionStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.service.getLatestSessionStats();
    return res.status(200).json(ApiResponse.success('Latest session stats fetched successfully', stats));
  });

  predictFarmMilk = asyncHandler(async (req: Request, res: Response) => {
    // 1. Point to your Render URL (store this in your backend .env under PYTHON_AGENT_URL)
    const agentUrl = process.env.PYTHON_AGENT_URL || 'https://milk-prediction-agent.onrender.com';

    console.log(`predictFarmMilk: sending prediction request to hosted agent at ${agentUrl}/predict`);

    try {
      const response = await fetch(`${agentUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Agent returned status code ${response.status}`);
      }
      const result = await response.json();
      return res.status(200).json(ApiResponse.success('Farm-wide milk prediction generated successfully', result));
    } catch (err: any) {
      console.error('predictFarmMilk connection error:', err);
      return res.status(500).json(ApiResponse.error(`Hosted prediction agent failed: ${err.message}`));
    }
  });
}
