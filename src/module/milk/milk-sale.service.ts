import { ApiError } from '../../utils/api-error';
import { Types } from 'mongoose';
import { MilkSaleRepository } from './milk-sale.repository';
import { IMilkSaleCreate, IMilkSaleFilter, IMilkSaleUpdate } from './milk-sale.types';
import { Income } from '../finance/finance.model';

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

    // Sync to Income schema
    try {
      await Income.create({
        milkSaleId: record._id,
        source: 'milk_sale',
        amount: money,
        description: `Milk Sale - ${amount} Liters`,
        date: saleDate,
        paymentMethod: (data as any).paymentMethod || 'cash',
        notes: data.notes,
        createdBy: record.recordedBy,
      });
    } catch (error) {
      console.error('Error syncing milk sale creation to Income:', error);
      throw error;
    }

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

  async updateMilkSale(id: string, data: IMilkSaleUpdate, userId?: string) {
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

    // Sync to Income schema
    try {
      const finalAmount = updated.amount;
      const finalMoney = updated.money;
      const finalDate = updated.date;
      const finalNotes = updated.notes;
      const paymentMethod = (data as any).paymentMethod;

      const updateFields: any = {
        amount: finalMoney,
        description: `Milk Sale - ${finalAmount} Liters`,
        date: finalDate,
        notes: finalNotes,
      };
      if (paymentMethod) {
        updateFields.paymentMethod = paymentMethod;
      }

      await Income.findOneAndUpdate(
        { milkSaleId: updated._id },
        {
          $set: updateFields,
          $setOnInsert: {
            milkSaleId: updated._id,
            source: 'milk_sale',
            createdBy: updated.recordedBy || (userId ? new Types.ObjectId(userId) : undefined),
            paymentMethod: paymentMethod || 'cash',
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error syncing milk sale update to Income:', error);
      throw error;
    }

    return this.repository.findById(updated._id.toString());
  }

  async deleteMilkSale(id: string) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new ApiError(404, 'Milk sale record not found');
    }

    await this.repository.delete(id);

    // Sync to Income schema
    try {
      await Income.deleteOne({ milkSaleId: record._id });
    } catch (error) {
      console.error('Error deleting synced Income record:', error);
      throw error;
    }

    return { message: 'Milk sale record deleted successfully' };
  }

  async getTodayStats() {
    return this.repository.getDailyStats(new Date());
  }

  async getTotalAmount(filter: IMilkSaleFilter = {}) {
    return this.repository.getTotalAmount(filter);
  }
}
