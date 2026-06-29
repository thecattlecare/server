import { MilkRepository } from './milk.repository';
import { IMilkCreate, IMilkUpdate, IMilkFilter, IMilkDashboardStats, IMilkProductionNotification } from './milk.types';
import { ApiError } from '../../utils/api-error';
import { Types } from 'mongoose';
import { Animal } from '../cattle/cattle.model';
import { INotification } from '../../utils/types';

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
      throw new ApiError(400, 'Duplication of milk at the same date, time, and same cow is not allowed');
    }

    const milkDate = data.date instanceof Date ? data.date : new Date(data.date);

    const record = await this.repository.create({
      ...data,
      date: milkDate,
      cattleId: new Types.ObjectId(data.cattleId as string),
      recordedBy: data.recordedBy ? new Types.ObjectId(data.recordedBy as string) : undefined
    });

    return this.repository.findById(record._id.toString(), { path: 'cattleId', select: 'name tag' });
  }

  async getMilkRecords(filter: IMilkFilter = {}) {
    return this.repository.findWithCattleDetails(filter);
  }

  async getMilkRecordById(id: string) {
    const record = await this.repository.findById(id, { path: 'cattleId', select: 'name tag group' });
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

    return this.repository.findById(updated._id.toString(), { path: 'cattleId', select: 'name tag' });
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

  async getProductionChangeNotification(targetDate: Date | string): Promise<INotification> {
    const affectedDate = new Date(targetDate);
    const previousDate = new Date(affectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    // Fetch daily stats for both days. Repository may return null/undefined when no records exist.
    const [currentStatsRaw, previousStatsRaw] = await Promise.all([
      this.repository.getDailyStats(affectedDate),
      this.repository.getDailyStats(previousDate),
    ]);

    const currentStats = currentStatsRaw || { totalAmount: 0 } as any;
    const previousStats = previousStatsRaw || { totalAmount: 0 } as any;

    const difference = (currentStats.totalAmount || 0) - (previousStats.totalAmount || 0);

    // Log for debugging when one of the days has no data
    if (!previousStatsRaw) {
      console.log('getProductionChangeNotification: previous day has no stats, defaulting to 0 for', previousDate.toISOString().split('T')[0]);
    }
    if (!currentStatsRaw) {
      console.log('getProductionChangeNotification: current day has no stats, defaulting to 0 for', affectedDate.toISOString().split('T')[0]);
    }
    const direction: INotification['direction'] = difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'neutral';
    const formattedAffectedDate = affectedDate.toISOString().split('T')[0];
    const formattedPreviousDate = previousDate.toISOString().split('T')[0];
    const amountChange = Math.abs(difference);
    const amountLabel = Number.isInteger(amountChange) ? String(amountChange) : amountChange.toFixed(1);
    const currentLabel = Number.isInteger(currentStats.totalAmount) ? String(currentStats.totalAmount) : currentStats.totalAmount.toFixed(1);
    const previousLabel = Number.isInteger(previousStats.totalAmount) ? String(previousStats.totalAmount) : previousStats.totalAmount.toFixed(1);

    const message = difference === 0
      ? `Milk production for ${formattedAffectedDate} is steady at ${currentLabel}kg compared with ${formattedPreviousDate}.`
      : `Milk production for ${formattedAffectedDate} is ${currentLabel}kg, ${amountLabel}kg ${difference > 0 ? 'higher' : 'lower'} than ${formattedPreviousDate} (${previousLabel}kg).`;

    return {
      id: `${formattedAffectedDate}-${Date.now()}`,
      // affectedDate: formattedAffectedDate,
      // currentAmount: currentStats.totalAmount,
      // previousAmount: previousStats.totalAmount,
      // difference,
      direction,
      message,
      createdAt: new Date().toISOString(),
    };
  }

  async getTotalAmount(filter: { startDate?: Date; endDate?: Date } = {}) {
    return this.repository.getTotalAmount(filter);
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
        tag: p.tag || 'N/A',
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

  async getLast14DaysProduction() {
    return this.repository.getLast14DaysProduction();
  }

  async getLast12WeeksProduction() {
    return this.repository.getLast12WeeksProduction();
  }

  async getLast12MonthsProduction() {
    return this.repository.getLast12MonthsProduction();
  }

  async getLatestSessionStats() {
    const now = new Date();

    const formatted = (d: Date) => d.toISOString().split('T')[0];

    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const prevDate = (d: Date) => {
      const x = new Date(d);
      x.setDate(x.getDate() - 1);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    // Decide whether today's Morning/Evening sessions have occurred yet.
    const hour = now.getHours();
    const morningHasOccurred = hour >= 12; // assume morning session occurs before noon
    const eveningHasOccurred = hour >= 18; // assume evening session occurs at/after 18:00

    const today = startOfDay(now);
    const yesterday = prevDate(today);

    const morningDate = morningHasOccurred ? today : yesterday;
    const morningPrevDate = prevDate(morningDate);

    const eveningDate = eveningHasOccurred ? today : yesterday;
    const eveningPrevDate = prevDate(eveningDate);

    const [morningStats, morningPrevStats, eveningStats, eveningPrevStats] = await Promise.all([
      this.repository.getDailyStats(morningDate),
      this.repository.getDailyStats(morningPrevDate),
      this.repository.getDailyStats(eveningDate),
      this.repository.getDailyStats(eveningPrevDate),
    ]);

    const mAmount = (morningStats && morningStats.byShift) ? (morningStats.byShift.Morning || 0) : 0;
    const mPrev = (morningPrevStats && morningPrevStats.byShift) ? (morningPrevStats.byShift.Morning || 0) : 0;
    const eAmount = (eveningStats && eveningStats.byShift) ? (eveningStats.byShift.Evening || 0) : 0;
    const ePrev = (eveningPrevStats && eveningPrevStats.byShift) ? (eveningPrevStats.byShift.Evening || 0) : 0;

    const morningDiff = mAmount - mPrev;
    const eveningDiff = eAmount - ePrev;

    return {
      morning: { date: formatted(morningDate), amount: mAmount },
      morningPrev: { date: formatted(morningPrevDate), amount: mPrev },
      evening: { date: formatted(eveningDate), amount: eAmount },
      eveningPrev: { date: formatted(eveningPrevDate), amount: ePrev },
      morningChange: morningDiff,
      eveningChange: eveningDiff,
      morningDirection: morningDiff > 0 ? 'increase' : morningDiff < 0 ? 'decrease' : 'stable',
      eveningDirection: eveningDiff > 0 ? 'increase' : eveningDiff < 0 ? 'decrease' : 'stable'
    };
  }
}
