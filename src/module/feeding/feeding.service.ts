import { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error';
import { FeedSchedule, FeedStock, FeedSupplier, IFeedSchedule, IFeedStock, IFeedSupplier } from './feeding.model';
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

const CRITICAL_THRESHOLD = 50;

export class FeedingService {
  async getStocks(query: IFeedStockQuery) {
    const filter: FilterQuery<IFeedStock> = { isActive: true };

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { brand: regex }];
    }

    if (query.status === 'critical') {
      filter.stockKg = { $lt: CRITICAL_THRESHOLD };
    } else if (query.status === 'ok') {
      filter.stockKg = { $gte: CRITICAL_THRESHOLD };
    }

    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const records = await FeedStock.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return records.sort((a, b) => {
      const totalA = a.stockKg * a.unitPrice;
      const totalB = b.stockKg * b.unitPrice;
      if (totalA === totalB) return a.name.localeCompare(b.name);
      return sortOrder === 1 ? totalA - totalB : totalB - totalA;
    });
  }

  async createStock(payload: IFeedStockCreate) {
    const record = await FeedStock.create(payload);
    return FeedStock.findById(record._id).lean();
  }

  async updateStock(id: string, payload: IFeedStockUpdate) {
    const record = await FeedStock.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!record) throw ApiError.NOT_FOUND('Feed stock not found');
    return record;
  }

  async adjustStock(id: string, delta: number) {
    const record = await FeedStock.findById(id);
    if (!record) throw ApiError.NOT_FOUND('Feed stock not found');

    record.stockKg = Math.max(0, record.stockKg + delta);
    await record.save();
    return FeedStock.findById(record._id).lean();
  }

  async deleteStock(id: string) {
    const record = await FeedStock.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    if (!record) throw ApiError.NOT_FOUND('Feed stock not found');
    return { id, deleted: true };
  }

  async getSchedules(query: IFeedScheduleQuery) {
    const filter: FilterQuery<IFeedSchedule> = { isActive: true };

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ group: regex }, { feedType: regex }, { time: regex }];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);
      filter.scheduleDate = { $gte: start, $lte: end };
    }

    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    return FeedSchedule.find(filter)
      .sort({ scheduleDate: sortDirection, time: sortDirection })
      .lean();
  }

  async createSchedule(payload: IFeedScheduleCreate) {
    const record = await FeedSchedule.create(payload);
    return FeedSchedule.findById(record._id).lean();
  }

  async updateSchedule(id: string, payload: IFeedScheduleUpdate) {
    const record = await FeedSchedule.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!record) throw ApiError.NOT_FOUND('Feed schedule not found');
    return record;
  }

  async toggleScheduleStatus(id: string) {
    const existing = await FeedSchedule.findById(id);
    if (!existing) throw ApiError.NOT_FOUND('Feed schedule not found');

    existing.status = existing.status === 'Pending' ? 'Done' : 'Pending';
    await existing.save();
    return FeedSchedule.findById(id).lean();
  }

  async deleteSchedule(id: string) {
    const record = await FeedSchedule.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    if (!record) throw ApiError.NOT_FOUND('Feed schedule not found');
    return { id, deleted: true };
  }

  async getSuppliers(query: IFeedSupplierQuery) {
    const filter: FilterQuery<IFeedSupplier> = { isActive: true };

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { contact: regex }, { feedType: regex }];
    }

    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    return FeedSupplier.find(filter).sort({ name: sortDirection }).lean();
  }

  async createSupplier(payload: IFeedSupplierCreate) {
    const record = await FeedSupplier.create(payload);
    return FeedSupplier.findById(record._id).lean();
  }

  async updateSupplier(id: string, payload: IFeedSupplierUpdate) {
    const record = await FeedSupplier.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!record) throw ApiError.NOT_FOUND('Supplier not found');
    return record;
  }

  async incrementOrders(id: string) {
    const record = await FeedSupplier.findById(id);
    if (!record) throw ApiError.NOT_FOUND('Supplier not found');
    record.orders += 1;
    await record.save();
    return FeedSupplier.findById(id).lean();
  }

  async deleteSupplier(id: string) {
    const record = await FeedSupplier.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    if (!record) throw ApiError.NOT_FOUND('Supplier not found');
    return { id, deleted: true };
  }
}
