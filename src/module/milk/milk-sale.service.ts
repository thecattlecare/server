import { ApiError } from '../../utils/api-error';
import { Types } from 'mongoose';
import { MilkSaleRepository } from './milk-sale.repository';
import { IMilkSaleCreate, IMilkSaleFilter, IMilkSaleUpdate } from './milk-sale.types';

export class MilkSaleService {
  private repository = new MilkSaleRepository();

  async createMilkSale(data: IMilkSaleCreate) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Sold milk amount must be greater than zero');
    }

    const money = Number((data as any).money);
    if (!Number.isFinite(money) || money < 0) {
      throw new ApiError(400, 'Money received is required');
    }

    const saleDate = data.date instanceof Date ? data.date : new Date(data.date);
    if (Number.isNaN(saleDate.getTime())) {
      throw new ApiError(400, 'Valid sale date is required');
    }

    const record = await this.repository.create({
      ...data,
      amount,
      money,
      date: saleDate,
      recordedBy: data.recordedBy ? new Types.ObjectId(data.recordedBy as string) : undefined,
    } as any);

    return this.repository.findById(record._id.toString());
  }

  async getMilkSales(filter: IMilkSaleFilter = {}) {
    return this.repository.findWithPagination({}, filter as any);
  }

  async getMilkSaleById(id: string) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new ApiError(404, 'Milk sale record not found');
    }
    return record;
  }

  async updateMilkSale(id: string, data: IMilkSaleUpdate) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new ApiError(404, 'Milk sale record not found');
    }

    const updatedData: IMilkSaleUpdate = { ...data };
    if (data.amount !== undefined) {
      updatedData.amount = Number(data.amount);
    }
    if ((data as any).money !== undefined) {
      updatedData.money = Number((data as any).money);
    }
    if (data.date) {
      const saleDate = data.date instanceof Date ? data.date : new Date(data.date);
      if (Number.isNaN(saleDate.getTime())) {
        throw new ApiError(400, 'Valid sale date is required');
      }
      updatedData.date = saleDate;
    }

    const updated = await this.repository.update(id, updatedData as any);
    if (!updated) {
      throw new ApiError(404, 'Milk sale record not found');
    }

    return this.repository.findById(updated._id.toString());
  }

  async deleteMilkSale(id: string) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new ApiError(404, 'Milk sale record not found');
    }

    await this.repository.delete(id);
    return { message: 'Milk sale record deleted successfully' };
  }

  async getTodayStats() {
    return this.repository.getDailyStats(new Date());
  }

  async getTotalAmount(filter: IMilkSaleFilter = {}) {
    return this.repository.getTotalAmount(filter);
  }
}
