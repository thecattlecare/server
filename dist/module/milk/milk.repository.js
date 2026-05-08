"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilkRepository = void 0;
const base_repository_1 = require("../../utils/base-repository");
const milk_model_1 = require("./milk.model");
const mongoose_1 = require("mongoose");
class MilkRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(milk_model_1.Milk);
    }
    async findByCattleId(cattleId, filter) {
        const query = { cattleId: new mongoose_1.Types.ObjectId(cattleId) };
        if (filter?.startDate || filter?.endDate) {
            query.date = {};
            if (filter.startDate)
                query.date.$gte = filter.startDate;
            if (filter.endDate)
                query.date.$lte = filter.endDate;
        }
        if (filter?.shift) {
            query.shift = filter.shift;
        }
        return this.model
            .find(query)
            .sort({ date: -1, shift: -1 })
            .limit(filter?.limit || 100)
            .populate('cattleId', 'name tag rfid');
    }
    async getDailyStats(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const result = await this.model.aggregate([
            {
                $match: {
                    date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    byShift: {
                        $push: {
                            shift: '$shift',
                            amount: '$amount'
                        }
                    }
                }
            }
        ]);
        if (result.length === 0) {
            return { totalAmount: 0, count: 0 };
        }
        const byShift = {
            Morning: 0,
            Evening: 0
        };
        result[0].byShift.forEach((record) => {
            byShift[record.shift] += record.amount;
        });
        return {
            totalAmount: result[0].totalAmount,
            count: result[0].count,
            byShift
        };
    }
    async getTotalAmount(filter = {}) {
        const query = {};
        if (filter.startDate || filter.endDate) {
            query.date = {};
            if (filter.startDate)
                query.date.$gte = filter.startDate;
            if (filter.endDate)
                query.date.$lte = filter.endDate;
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
    async getStatsByDateRange(startDate, endDate) {
        return this.model.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        shift: '$shift'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.date': 1, '_id.shift': 1 }
            }
        ]);
    }
    async findWithCattleDetails(filter = {}) {
        const query = {};
        const { cattleId, shift, startDate, endDate, page = 1, limit = 20 } = filter;
        if (cattleId) {
            query.cattleId = new mongoose_1.Types.ObjectId(cattleId);
        }
        if (shift) {
            query.shift = shift;
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = startDate;
            if (endDate)
                query.date.$lte = endDate;
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.model
                .find(query)
                .populate('cattleId', 'name tag rfid gender group isActive')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(query)
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async getTopProducers(limit = 5, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return this.model.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$cattleId',
                    totalAmount: { $sum: '$amount' },
                    recordCount: { $sum: 1 },
                    averagePerDay: { $avg: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'animals',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'cattle'
                }
            },
            {
                $unwind: '$cattle'
            },
            {
                $project: {
                    cattleId: '$_id',
                    name: '$cattle.name',
                    tag: '$cattle.tag',
                    rfid: '$cattle.rfid',
                    totalAmount: 1,
                    averagePerDay: 1,
                    recordCount: 1
                }
            },
            {
                $sort: { totalAmount: -1 }
            },
            {
                $limit: limit
            }
        ]);
    }
    async getLast14DaysProduction() {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 13); // 13 days ago to include today = 14 days
        startDate.setHours(0, 0, 0, 0);
        const result = await this.model.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        // Fill in missing days with 0
        const dayMap = {};
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dayMap[dateStr] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        result.forEach((item) => {
            dayMap[item._id] = item.totalAmount;
        });
        return Object.entries(dayMap).map(([date, amount]) => ({
            date,
            amount: amount
        }));
    }
    async getLast12WeeksProduction() {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (12 * 7 - 1)); // 12 weeks
        startDate.setHours(0, 0, 0, 0);
        const result = await this.model.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        week: { $week: '$date' }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.week': 1 }
            }
        ]);
        return result.map((item) => ({
            week: `W${item._id.week}`,
            amount: item.totalAmount
        }));
    }
    async getLast12MonthsProduction() {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        const result = await this.model.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m', date: '$date' }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        const monthMap = {};
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const monthStr = currentDate.toISOString().slice(0, 7);
            monthMap[monthStr] = 0;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        result.forEach((item) => {
            monthMap[item._id] = item.totalAmount;
        });
        return Object.entries(monthMap).map(([month, amount]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            amount: amount
        }));
    }
}
exports.MilkRepository = MilkRepository;
