"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilkSaleRepository = void 0;
const base_repository_1 = require("../../utils/base-repository");
const milk_sale_model_1 = require("./milk-sale.model");
class MilkSaleRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(milk_sale_model_1.MilkSale);
    }
    async getDailyStats(date = new Date()) {
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
}
exports.MilkSaleRepository = MilkSaleRepository;
