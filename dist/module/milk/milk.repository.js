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
}
exports.MilkRepository = MilkRepository;
