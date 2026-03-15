import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { FeedingService } from './feeding.service';
import {
  IFeedScheduleCreate,
  IFeedScheduleQuery,
  IFeedScheduleUpdate,
  IFeedStockCreate,
  IFeedStockQuery,
  IFeedStockUpdate,
  IFeedSupplierCreate,
  IFeedSupplierQuery,
  IFeedSupplierUpdate,
} from './feeding.types';

export class FeedingController {
  private service = new FeedingService();

  getStocks = async (req: Request, res: Response) => {
    const query: IFeedStockQuery = {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status === 'ok' || req.query.status === 'critical' ? req.query.status : undefined,
      sortOrder: req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc' ? req.query.sortOrder : undefined,
    };

    const records = await this.service.getStocks(query);
    return res.status(200).json(ApiResponse.success('Feed stocks fetched successfully', records));
  };

  createStock = async (req: Request, res: Response) => {
    const payload = req.body as Partial<IFeedStockCreate>;

    if (!payload.name || !payload.brand) {
      throw ApiError.BAD_REQUEST('Name and brand are required');
    }

    const stockKg = Number(payload.stockKg);
    const unitPrice = Number(payload.unitPrice);

    if (!Number.isFinite(stockKg) || stockKg < 0) {
      throw ApiError.BAD_REQUEST('stockKg must be a non-negative number');
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw ApiError.BAD_REQUEST('unitPrice must be a non-negative number');
    }

    const record = await this.service.createStock({
      name: payload.name.trim(),
      brand: payload.brand.trim(),
      stockKg,
      unitPrice,
    });

    return res.status(201).json(ApiResponse.success('Feed stock created successfully', record));
  };

  updateStock = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.BAD_REQUEST('Invalid stock id');
    }

    const payload = req.body as IFeedStockUpdate;

    if (payload.stockKg !== undefined) {
      const parsedStock = Number(payload.stockKg);
      if (!Number.isFinite(parsedStock) || parsedStock < 0) {
        throw ApiError.BAD_REQUEST('stockKg must be a non-negative number');
      }
      payload.stockKg = parsedStock;
    }

    if (payload.unitPrice !== undefined) {
      const parsedUnitPrice = Number(payload.unitPrice);
      if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
        throw ApiError.BAD_REQUEST('unitPrice must be a non-negative number');
      }
      payload.unitPrice = parsedUnitPrice;
    }

    const record = await this.service.updateStock(id, payload);
    return res.status(200).json(ApiResponse.success('Feed stock updated successfully', record));
  };

  adjustStock = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.BAD_REQUEST('Invalid stock id');
    }

    const delta = Number(req.body?.delta);
    if (!Number.isFinite(delta)) {
      throw ApiError.BAD_REQUEST('delta must be a valid number');
    }

    const record = await this.service.adjustStock(id, delta);
    return res.status(200).json(ApiResponse.success('Feed stock adjusted successfully', record));
  };

  deleteStock = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.BAD_REQUEST('Invalid stock id');
    }

    const result = await this.service.deleteStock(id);
    return res.status(200).json(ApiResponse.success('Feed stock deleted successfully', result));
  };

  getSchedules = async (req: Request, res: Response) => {
    const query: IFeedScheduleQuery = {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status === 'Pending' || req.query.status === 'Done' ? req.query.status : undefined,
      date: req.query.date ? new Date(String(req.query.date)) : undefined,
      sortOrder: req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc' ? req.query.sortOrder : undefined,
    };

    const records = await this.service.getSchedules(query);
    return res.status(200).json(ApiResponse.success('Feed schedules fetched successfully', records));
  };

  createSchedule = async (req: Request, res: Response) => {
    const payload = req.body as Partial<IFeedScheduleCreate>;
    if (!payload.group || !payload.time || !payload.feedType || !payload.scheduleDate) {
      throw ApiError.BAD_REQUEST('group, time, feedType and scheduleDate are required');
    }

    const scheduleDate = new Date(payload.scheduleDate);
    if (Number.isNaN(scheduleDate.getTime())) {
      throw ApiError.BAD_REQUEST('scheduleDate must be a valid date');
    }

    const status = payload.status === 'Done' ? 'Done' : 'Pending';

    const record = await this.service.createSchedule({
      group: payload.group.trim(),
      time: payload.time.trim(),
      feedType: payload.feedType.trim(),
      scheduleDate,
      status,
    });

    return res.status(201).json(ApiResponse.success('Feed schedule created successfully', record));
  };

  updateSchedule = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.BAD_REQUEST('Invalid schedule id');
    }

    const payload = req.body as IFeedScheduleUpdate;

    if (payload.scheduleDate !== undefined) {
      const parsedDate = new Date(payload.scheduleDate);
      if (Number.isNaN(parsedDate.getTime())) {
        throw ApiError.BAD_REQUEST('scheduleDate must be a valid date');
      }
      payload.scheduleDate = parsedDate;
    }

    const record = await this.service.updateSchedule(id, payload);
    return res.status(200).json(ApiResponse.success('Feed schedule updated successfully', record));
  };

  toggleScheduleStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.BAD_REQUEST('Invalid schedule id');
    }

    const record = await this.service.toggleScheduleStatus(id);
    return res.status(200).json(ApiResponse.success('Feed schedule status updated successfully', record));
  };

  deleteSchedule = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.BAD_REQUEST('Invalid schedule id');
    }

    const result = await this.service.deleteSchedule(id);
    return res.status(200).json(ApiResponse.success('Feed schedule deleted successfully', result));
  };

  getSuppliers = async (req: Request, res: Response) => {
    const query: IFeedSupplierQuery = {
      search: req.query.search ? String(req.query.search) : undefined,
      sortOrder: req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc' ? req.query.sortOrder : undefined,
    };
    const records = await this.service.getSuppliers(query);
    return res.status(200).json(ApiResponse.success('Suppliers fetched successfully', records));
  };

  createSupplier = async (req: Request, res: Response) => {
    const payload = req.body as Partial<IFeedSupplierCreate>;
    if (!payload.name || !payload.contact || !payload.feedType) {
      throw ApiError.BAD_REQUEST('name, contact and feedType are required');
    }
    const orders = payload.orders !== undefined ? Number(payload.orders) : 0;
    if (!Number.isFinite(orders) || orders < 0) {
      throw ApiError.BAD_REQUEST('orders must be a non-negative number');
    }
    const record = await this.service.createSupplier({
      name: payload.name.trim(),
      contact: payload.contact.trim(),
      feedType: payload.feedType.trim(),
      orders,
    });
    return res.status(201).json(ApiResponse.success('Supplier created successfully', record));
  };

  updateSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) throw ApiError.BAD_REQUEST('Invalid supplier id');
    const payload = req.body as IFeedSupplierUpdate;
    if (payload.orders !== undefined) {
      const orders = Number(payload.orders);
      if (!Number.isFinite(orders) || orders < 0) throw ApiError.BAD_REQUEST('orders must be a non-negative number');
      payload.orders = orders;
    }
    const record = await this.service.updateSupplier(id, payload);
    return res.status(200).json(ApiResponse.success('Supplier updated successfully', record));
  };

  incrementOrders = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) throw ApiError.BAD_REQUEST('Invalid supplier id');
    const record = await this.service.incrementOrders(id);
    return res.status(200).json(ApiResponse.success('Orders incremented successfully', record));
  };

  deleteSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) throw ApiError.BAD_REQUEST('Invalid supplier id');
    const result = await this.service.deleteSupplier(id);
    return res.status(200).json(ApiResponse.success('Supplier deleted successfully', result));
  };
}
