import { BaseRepository } from '../../utils/base-repository';
import { IMilkSale } from './milk-sale.model';
import { MilkSale } from './milk-sale.model';
import { IMilkSaleFilter, IMilkSaleStats } from './milk-sale.types';

export class MilkSaleRepository extends BaseRepository<IMilkSale> {
  constructor() {
    super(MilkSale);
  }

  async getDailyStats(date: Date = new Date()): Promise<IMilkSaleStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.model.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalMoney: { $sum: '$money' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { totalAmount: 0, count: 0, totalMoney: 0 };
    }

    return {
      totalAmount: result[0].totalAmount,
      count: result[0].count,
      totalMoney: result[0].totalMoney || 0,
      averagePerRecord: result[0].count > 0 ? result[0].totalAmount / result[0].count : 0,
    };
  }

  async getTotalAmount(filter: IMilkSaleFilter = {}): Promise<number> {
    const query: any = {};

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) query.date.$gte = filter.startDate;
      if (filter.endDate) query.date.$lte = filter.endDate;
    }

    const result = await this.model.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalAmount : 0;
  }
}
