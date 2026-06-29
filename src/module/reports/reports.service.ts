import { Types } from 'mongoose';
import { Animal } from '../cattle/cattle.model';
import { Milk } from '../milk/milk.model';
import { MilkSale } from '../milk/milk-sale.model';
import { FeedStock } from '../feeding/feeding.model';
import { DiseaseRecord } from '../health/health.model';
import { User } from '../auth/auth.model';
import { ApiError } from '../../utils/api-error';
import {
  IAnimalReportResponse,
  IBreedingReportResponse,
  IDateRangeQuery,
  IFinancialSummaryResponse,
  IHealthReportResponse,
  IMilkInventoryReportResponse,
  IMilkProductionReportResponse,
} from './reports.types';

type NormalizedRange = {
  startDate: Date;
  endDate: Date;
};

type MaybeRange = NormalizedRange | null;

const toStartOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toEndOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);
const formatMonthKey = (date: Date) => date.toISOString().slice(0, 7);

const safeDateKey = (value: unknown, fallback = '-') => {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return formatDateKey(date);
};

const daysBetween = (startDate: Date, endDate: Date) => {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const monthsBetween = (startDate: Date, endDate: Date) => {
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const limit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= limit) {
    months.push(formatMonthKey(new Date(current)));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

const parseBreedingEntry = (notes?: string) => {
  if (!notes) {
    return { breedingDate: '', breedingType: '-', semenBullInfo: '-' };
  }

  const entries = notes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('[Breeding '));

  if (entries.length === 0) {
    return { breedingDate: '', breedingType: '-', semenBullInfo: '-' };
  }

  const latest = entries[entries.length - 1];
  const match = latest.match(/\[Breeding\s([^\]]+)\]\sInseminated\svia\s([^:]+):\s(.+)/i);

  if (!match) {
    return { breedingDate: '', breedingType: '-', semenBullInfo: '-' };
  }

  return {
    breedingDate: match[1],
    breedingType: match[2].trim(),
    semenBullInfo: match[3].trim(),
  };
};

const buildDateMatch = (field: string, range: MaybeRange) => {
  if (!range) {
    return {};
  }

  return {
    [field]: {
      $gte: range.startDate,
      $lte: range.endDate,
    },
  };
};

const activeOrMissing = {
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
};

export class ReportsService {
  private resolveRange(query: IDateRangeQuery, fallbackDays = 30): MaybeRange {
    if (!query.startDate && !query.endDate) {
      return null;
    }

    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate);

    if (!query.startDate) {
      startDate.setDate(endDate.getDate() - (fallbackDays - 1));
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw ApiError.BAD_REQUEST('Invalid date range');
    }

    return {
      startDate: toStartOfDay(startDate),
      endDate: toEndOfDay(endDate),
    };
  }

  async getMilkProductionReport(query: IDateRangeQuery): Promise<IMilkProductionReportResponse> {
    const dateRange = this.resolveRange(query);
    const dateMatch = buildDateMatch('date', dateRange);

    const [records, summaryResult, topProducers] = await Promise.all([
      Milk.aggregate([
        ...(dateRange ? [{ $match: dateMatch }] : []),
        {
          $lookup: {
            from: 'animals',
            localField: 'cattleId',
            foreignField: '_id',
            as: 'animal',
          },
        },
        { $unwind: { path: '$animal', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            animalId: { $toString: '$cattleId' },
            animalName: { $ifNull: ['$animal.name', 'Unknown'] },
            earTag: { $ifNull: ['$animal.tag', '-'] },
            date: 1,
            session: '$shift',
            quantityProduced: '$amount',
          },
        },
        { $sort: { date: -1, createdAt: -1 } },
      ]),
      Milk.aggregate([
        ...(dateRange ? [{ $match: dateMatch }] : []),
        {
          $group: {
            _id: null,
            totalMilkProduction: { $sum: '$amount' },
            recordCount: { $sum: 1 },
          },
        },
      ]),
      Milk.aggregate([
        ...(dateRange ? [{ $match: dateMatch }] : []),
        {
          $group: {
            _id: '$cattleId',
            totalMilkProduction: { $sum: '$amount' },
            recordCount: { $sum: 1 },
            averageMilkProduction: { $avg: '$amount' },
          },
        },
        {
          $lookup: {
            from: 'animals',
            localField: '_id',
            foreignField: '_id',
            as: 'animal',
          },
        },
        { $unwind: { path: '$animal', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            animalId: { $toString: '$_id' },
            animalName: { $ifNull: ['$animal.name', 'Unknown'] },
            earTag: { $ifNull: ['$animal.tag', '-'] },
            totalMilkProduction: 1,
            averageMilkProduction: 1,
            recordCount: 1,
          },
        },
        { $sort: { totalMilkProduction: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const totalMilkProduction = Number(summaryResult[0]?.totalMilkProduction ?? 0);
    const recordCount = Number(summaryResult[0]?.recordCount ?? 0);

    return {
      summary: {
        totalMilkProduction,
        averageMilkProduction: recordCount > 0 ? totalMilkProduction / recordCount : 0,
      },
      topMilkProducingAnimals: topProducers,
      records: records.map((record: any) => ({
        ...record,
        _id: record._id.toString(),
        date: safeDateKey(record.date),
      })),
    };
  }

  async getMilkInventoryReport(query: IDateRangeQuery): Promise<IMilkInventoryReportResponse> {
    const dateRange = this.resolveRange(query, 30);

    const [productionDaily, salesDaily, productionMonthly, salesMonthly, totals] = await Promise.all([
      Milk.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalMilk: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MilkSale.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            milkSold: { $sum: '$amount' },
            revenue: { $sum: '$money' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Milk.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            totalMilk: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MilkSale.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            milkSold: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MilkSale.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        {
          $group: {
            _id: null,
            totalMilkSold: { $sum: '$amount' },
            totalRevenue: { $sum: '$money' },
          },
        },
      ]),
    ]);

    const records = productionDaily.map((item: any) => {
      const sold = salesDaily.find((entry: any) => entry._id === item._id)?.milkSold ?? 0;
      const totalMilk = Number(item.totalMilk ?? 0);
      const milkSold = Number(sold ?? 0);
      const milkUsed = 0;
      return {
        date: item._id,
        totalMilk,
        milkSold,
        milkUsed,
        remainingMilk: Math.max(totalMilk - milkSold - milkUsed, 0),
      };
    });

    const dailyChart = records.map((record) => ({
      date: record.date,
      totalMilk: record.totalMilk,
      milkSold: record.milkSold,
      remainingMilk: record.remainingMilk,
    }));

    const monthlyChart = productionMonthly.map((item: any) => {
      const sold = salesMonthly.find((entry: any) => entry._id === item._id)?.milkSold ?? 0;
      const totalMilk = Number(item.totalMilk ?? 0);
      const milkSold = Number(sold ?? 0);

      return {
        month: item._id,
        totalMilk,
        milkSold,
        remainingMilk: Math.max(totalMilk - milkSold, 0),
      };
    });

    const totalMilk = records.reduce((sum, item) => sum + item.totalMilk, 0);
    const totalMilkSold = Number(totals[0]?.totalMilkSold ?? 0);
    const totalRevenue = Number(totals[0]?.totalRevenue ?? 0);
    const milkUsed = 0;
    const remainingMilk = Math.max(totalMilk - totalMilkSold - milkUsed, 0);

    return {
      summary: {
        totalMilk,
        milkSold: totalMilkSold,
        milkUsed,
        remainingMilk,
        totalMilkSold,
        totalRevenue,
      },
      records,
      dailyChart,
      monthlyChart,
    };
  }

  async getAnimalReport(): Promise<IAnimalReportResponse> {
    const [summary, breedStats, genderStats, lactationStageStats, reproductiveStatusStats] = await Promise.all([
      Animal.aggregate([
        { $match: activeOrMissing },
        {
          $group: {
            _id: null,
            totalAnimals: { $sum: 1 },
            activeAnimals: {
              $sum: {
                $cond: [
                  {
                    $or: [{ $eq: ['$isActive', true] }, { $eq: [{ $type: '$isActive' }, 'missing'] }],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Animal.aggregate([
        { $match: activeOrMissing },
        { $group: { _id: '$breed', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Animal.aggregate([
        { $match: activeOrMissing },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Animal.aggregate([
        { $match: activeOrMissing },
        { $group: { _id: '$lactationStage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Animal.aggregate([
        { $match: activeOrMissing },
        { $group: { _id: '$reproductiveStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      summary: {
        totalAnimals: Number(summary[0]?.totalAnimals ?? 0),
        activeAnimals: Number(summary[0]?.activeAnimals ?? 0),
      },
      breedStats: breedStats.map((item: any) => ({ breed: item._id || 'Unknown', count: item.count })),
      genderStats: genderStats.map((item: any) => ({ gender: item._id || 'Unknown', count: item.count })),
      lactationStageStats: lactationStageStats.map((item: any) => ({ stage: item._id || 'Unknown', count: item.count })),
      reproductiveStatusStats: reproductiveStatusStats.map((item: any) => ({ status: item._id || 'Unknown', count: item.count })),
    };
  }

  async getHealthReport(query: IDateRangeQuery): Promise<IHealthReportResponse> {
    const dateRange = this.resolveRange(query);
    const match: Record<string, unknown> = {
      ...(dateRange ? buildDateMatch('startDate', dateRange) : {}),
    };

    if (query.animalId && Types.ObjectId.isValid(query.animalId)) {
      match.animalId = new Types.ObjectId(query.animalId);
    }

    const records = await DiseaseRecord.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'animals',
          localField: 'animalId',
          foreignField: '_id',
          as: 'animal',
        },
      },
      { $unwind: { path: '$animal', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          animalName: { $ifNull: ['$animal.name', 'Unknown'] },
          earTag: { $ifNull: ['$animal.tag', '-'] },
          disease: 1,
          treatment: { $ifNull: ['$treatment', '$medicine'] },
          medicine: { $ifNull: ['$medicine', '-'] },
          treatmentCost: { $ifNull: ['$treatmentCost', 0] },
          recoveryStatus: '$status',
          startDate: 1,
        },
      },
      { $sort: { startDate: -1, createdAt: -1 } },
    ]);

    const summary = records.reduce(
      (acc: any, record: any) => {
        acc.totalRecords += 1;
        acc.totalTreatmentExpenses += Number(record.treatmentCost ?? 0);
        if (record.recoveryStatus === 'Recovered') {
          acc.recoveredCases += 1;
        } else {
          acc.activeCases += 1;
        }
        return acc;
      },
      { totalRecords: 0, totalTreatmentExpenses: 0, recoveredCases: 0, activeCases: 0 }
    );

    return {
      summary,
      chartData: [
        { name: 'Recovered', value: summary.recoveredCases },
        { name: 'Active', value: summary.activeCases },
      ],
      records: records.map((record: any) => ({
        ...record,
        _id: record._id.toString(),
        startDate: safeDateKey(record.startDate),
      })),
    };
  }

  async getBreedingReport(query: IDateRangeQuery): Promise<IBreedingReportResponse> {
    const animals = await Animal.find({ ...activeOrMissing, gender: 'Female' }).lean();
    const dateRange = this.resolveRange(query);

    const records = animals
      .map((animal: any) => {
        const parsed = parseBreedingEntry(animal.notes);
        const breedingDate = parsed.breedingDate || (animal.calvingDate ? formatDateKey(new Date(animal.calvingDate)) : '');
        const pregnancyStatus = animal.reproductiveStatus || 'Open';

        return {
          _id: animal._id.toString(),
          animalName: animal.name,
          earTag: animal.tag || '-',
          breedingDate,
          breedingType: parsed.breedingType,
          semenBullInfo: parsed.semenBullInfo,
          pregnancyStatus,
          calvingDate: safeDateKey(animal.calvingDate),
        };
      })
      .filter((record: any) => {
        if (query.search) {
          const search = query.search.toLowerCase().trim();
          const haystack = [record.animalName, record.earTag, record.breedingType, record.semenBullInfo, record.pregnancyStatus]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(search)) {
            return false;
          }
        }

        if (dateRange) {
          const recordDate = record.breedingDate ? new Date(record.breedingDate) : null;
          if (!recordDate || Number.isNaN(recordDate.getTime())) {
            return false;
          }

          if (recordDate < dateRange.startDate) {
            return false;
          }

          if (recordDate > dateRange.endDate) {
            return false;
          }
        }

        return true;
      })
      .sort((left: any, right: any) => {
        const leftTime = left.breedingDate ? new Date(left.breedingDate).getTime() : 0;
        const rightTime = right.breedingDate ? new Date(right.breedingDate).getTime() : 0;
        return rightTime - leftTime;
      });

    const breedingTypeStatsMap = new Map<string, number>();
    records.forEach((record: any) => {
      const key = record.breedingType || 'Unknown';
      breedingTypeStatsMap.set(key, (breedingTypeStatsMap.get(key) || 0) + 1);
    });

    return {
      summary: {
        totalBreedingRecords: records.length,
        totalPregnantAnimals: records.filter((record: any) => record.pregnancyStatus === 'Pregnant').length,
        inseminatedAnimals: records.filter((record: any) => record.pregnancyStatus === 'Inseminated').length,
      },
      breedingTypeStats: Array.from(breedingTypeStatsMap.entries()).map(([breedingType, count]) => ({ breedingType, count })),
      records,
    };
  }

  async getFinancialSummary(query: IDateRangeQuery): Promise<IFinancialSummaryResponse> {
    const dateRange = this.resolveRange(query, 30);

    const [milkRevenueResult, treatmentResult, feedResult, laborResult, totalAnimals, monthlyMilkProduction] = await Promise.all([
      MilkSale.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        { $group: { _id: null, totalRevenue: { $sum: '$money' } } },
      ]),
      DiseaseRecord.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('startDate', dateRange) }] : []),
        { $group: { _id: null, totalTreatmentExpenses: { $sum: { $ifNull: ['$treatmentCost', 0] } } } },
      ]),
      FeedStock.aggregate([
        { $match: activeOrMissing },
        {
          $group: {
            _id: null,
            totalFeedExpenses: {
              $sum: { $multiply: [{ $ifNull: ['$stockKg', 0] }, { $ifNull: ['$unitPrice', 0] }] },
            },
          },
        },
      ]),
      User.aggregate([
        { $match: activeOrMissing },
        { $group: { _id: null, totalLaborExpenses: { $sum: { $ifNull: ['$salary', 0] } } } },
      ]),
      Animal.countDocuments(activeOrMissing),
      Milk.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        { $group: { _id: null, monthlyMilkProduction: { $sum: '$amount' } } },
      ]),
    ]);

    const [monthlyRevenue, monthlyTreatment, monthlyFeed, monthlyLabor, monthlyMilk] = await Promise.all([
      MilkSale.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, revenue: { $sum: '$money' } } },
        { $sort: { _id: 1 } },
      ]),
      DiseaseRecord.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('startDate', dateRange) }] : []),
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$startDate' } }, treatmentExpenses: { $sum: { $ifNull: ['$treatmentCost', 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      FeedStock.aggregate([
        { $match: activeOrMissing },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            feedExpenses: {
              $sum: { $multiply: [{ $ifNull: ['$stockKg', 0] }, { $ifNull: ['$unitPrice', 0] }] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: activeOrMissing },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, laborExpenses: { $sum: { $ifNull: ['$salary', 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      Milk.aggregate([
        ...(dateRange ? [{ $match: buildDateMatch('date', dateRange) }] : []),
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, production: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const months = Array.from(
      new Set([
        ...monthlyRevenue.map((item: any) => item._id),
        ...monthlyTreatment.map((item: any) => item._id),
        ...monthlyFeed.map((item: any) => item._id),
        ...monthlyLabor.map((item: any) => item._id),
        ...monthlyMilk.map((item: any) => item._id),
      ])
    ).sort();
    const revenueMap = new Map(monthlyRevenue.map((item: any) => [item._id, Number(item.revenue ?? 0)]));
    const treatmentMap = new Map(monthlyTreatment.map((item: any) => [item._id, Number(item.treatmentExpenses ?? 0)]));
    const feedMap = new Map(monthlyFeed.map((item: any) => [item._id, Number(item.feedExpenses ?? 0)]));
    const laborMap = new Map(monthlyLabor.map((item: any) => [item._id, Number(item.laborExpenses ?? 0)]));
    const milkMap = new Map(monthlyMilk.map((item: any) => [item._id, Number(item.production ?? 0)]));

    const revenueVsExpenses = months.map((month) => {
      const revenue = revenueMap.get(month) ?? 0;
      const expenses = (treatmentMap.get(month) ?? 0) + (feedMap.get(month) ?? 0) + (laborMap.get(month) ?? 0);
      return { month, revenue, expenses };
    });

    const monthlyProfitTrend = revenueVsExpenses.map((item) => ({
      month: item.month,
      profit: item.revenue - item.expenses,
    }));

    const monthlyMilkProductionTrend = months.map((month) => ({
      month,
      production: milkMap.get(month) ?? 0,
    }));

    const milkRevenue = Number(milkRevenueResult[0]?.totalRevenue ?? 0);
    const treatmentExpenses = Number(treatmentResult[0]?.totalTreatmentExpenses ?? 0);
    const feedExpenses = Number(feedResult[0]?.totalFeedExpenses ?? 0);
    const laborExpenses = Number(laborResult[0]?.totalLaborExpenses ?? 0);
    const totalExpenses = treatmentExpenses + feedExpenses + laborExpenses;
    const netProfit = milkRevenue - totalExpenses;

    return {
      kpis: {
        totalRevenue: milkRevenue,
        totalExpenses,
        netProfit,
        totalAnimals,
        monthlyMilkProduction: Number(monthlyMilkProduction[0]?.monthlyMilkProduction ?? 0),
      },
      charts: {
        revenueVsExpenses,
        monthlyProfitTrend,
        monthlyMilkProduction: monthlyMilkProductionTrend,
      },
      breakdown: {
        milkRevenue,
        treatmentExpenses,
        feedExpenses,
        laborExpenses,
      },
    };
  }
}
