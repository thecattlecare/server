import { MilkRepository } from './milk.repository';
import { IMilkCreate, IMilkUpdate, IMilkFilter, IMilkDashboardStats } from './milk.types';
import { ApiError } from '../../utils/api-error';
import { Types } from 'mongoose';
import { Animal } from '../cattle/cattle.model';

export class MilkService {
  private repository = new MilkRepository();

  async createMilkRecord(data: IMilkCreate) {
    // Validate cattle exists and is a milking animal
    const cattle = await Animal.findById(data.cattleId);
    if (!cattle) {
      throw new ApiError(404, 'Cattle not found');
    }

    // Check if cattle is eligible for milking
    if (cattle.gender === 'Male' || cattle.group === 'Calf') {
      throw new ApiError(400, 'Selected animal is not a milking cow');
    }

    // Check for duplicate record (same cattle, shift, date)
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await this.repository.findOne({
      cattleId: new Types.ObjectId(data.cattleId as string),
      shift: data.shift,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingRecord) {
      throw new ApiError(400, `Milk record for ${data.shift} shift already exists for this date`);
    }

    const milkDate = data.date instanceof Date ? data.date : new Date(data.date);

    const record = await this.repository.create({
      ...data,
      date: milkDate,
      cattleId: new Types.ObjectId(data.cattleId as string),
      recordedBy: data.recordedBy ? new Types.ObjectId(data.recordedBy as string) : undefined
    });

    return this.repository.findById(record._id.toString(), { path: 'cattleId', select: 'name tag rfid' });
  }

  async getMilkRecords(filter: IMilkFilter = {}) {
    return this.repository.findWithCattleDetails(filter);
  }

  async getMilkRecordById(id: string) {
    const record = await this.repository.findById(id, { path: 'cattleId', select: 'name tag rfid group' });
    if (!record) {
      throw new ApiError(404, 'Milk record not found');
    }
    return record;
  }

  async updateMilkRecord(id: string, data: IMilkUpdate) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new ApiError(404, 'Milk record not found');
    }

    // If date or shift is being updated, check for duplicates
    if (data.date || data.shift) {
      const startOfDay = new Date(data.date || record.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(data.date || record.date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingRecord = await this.repository.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        cattleId: record.cattleId,
        shift: data.shift || record.shift,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingRecord) {
        throw new ApiError(400, 'A record for this shift already exists on this date');
      }
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new ApiError(404, 'Milk record not found');
    }

    return this.repository.findById(updated._id.toString(), { path: 'cattleId', select: 'name tag rfid' });
  }

  async deleteMilkRecord(id: string) {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new ApiError(404, 'Milk record not found');
    }
    await this.repository.delete(id);
    return { message: 'Milk record deleted successfully' };
  }

  async getTodayStats() {
    return this.repository.getDailyStats(new Date());
  }

  async getDashboardStats(): Promise<IMilkDashboardStats> {
    const today = new Date();
    
    // Start of today
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    // Start of week (last 7 days)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Start of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // End of today
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Get today's stats
    const todayStats = await this.repository.getDailyStats();

    // Get week stats
    const weekRecords = await this.repository.find({
      date: { $gte: startOfWeek, $lte: endOfToday }
    });

    const weekTotal = weekRecords.reduce((sum, record) => sum + record.amount, 0);
    const weekCount = weekRecords.length;
    const daysWithData = new Set(weekRecords.map(r => r.date.toDateString())).size;

    // Get month stats
    const monthRecords = await this.repository.find({
      date: { $gte: startOfMonth, $lte: endOfToday }
    });

    const monthTotal = monthRecords.reduce((sum, record) => sum + record.amount, 0);
    const monthCount = monthRecords.length;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysSoFar = today.getDate();
    
    // Projected monthly total
    const projectedTotal = daysSoFar > 0 ? (monthTotal / daysSoFar) * daysInMonth : 0;

    // Get top producers
    const topProducers = await this.repository.getTopProducers(5, 30);

    return {
      today: todayStats,
      week: {
        totalAmount: weekTotal,
        count: weekCount,
        dailyAverage: daysWithData > 0 ? weekTotal / daysWithData : 0
      },
      month: {
        totalAmount: monthTotal,
        count: monthCount,
        projectedTotal
      },
      topProducers: topProducers.map(p => ({
        cattleId: p.cattleId.toString(),
        name: p.name,
        tag: p.tag || p.rfid?.slice(-6) || 'N/A',
        totalAmount: p.totalAmount,
        averagePerDay: p.averagePerDay
      }))
    };
  }

  async getCattleMilkHistory(cattleId: string, days: number = 30) {
    const cattle = await Animal.findById(cattleId);
    if (!cattle) {
      throw new ApiError(404, 'Cattle not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.repository.findWithCattleDetails({
      cattleId,
      startDate,
      limit: 100
    });

    // Group by date for chart data
    const chartData = records.data.reduce((acc: any, record: any) => {
      const dateStr = new Date(record.date).toLocaleDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, Morning: 0, Evening: 0, total: 0 };
      }
      acc[dateStr][record.shift] = record.amount;
      acc[dateStr].total += record.amount;
      return acc;
    }, {});

    return {
      cattle: {
        id: cattle._id,
        name: cattle.name,
        tag: cattle.tag,
        rfid: cattle.rfid
      },
      records: records.data,
      chartData: Object.values(chartData),
      summary: {
        totalAmount: records.data.reduce((sum: number, r: any) => sum + r.amount, 0),
        averagePerDay: records.data.length / days,
        recordCount: records.data.length
      }
    };
  }
}