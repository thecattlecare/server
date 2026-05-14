"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilkSaleService = void 0;
const api_error_1 = require("../../utils/api-error");
const mongoose_1 = require("mongoose");
const milk_sale_repository_1 = require("./milk-sale.repository");
class MilkSaleService {
    constructor() {
        this.repository = new milk_sale_repository_1.MilkSaleRepository();
    }
    async createMilkSale(data) {
        const amount = Number(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new api_error_1.ApiError(400, 'Sold milk amount must be greater than zero');
        }
        const money = Number(data.money);
        if (!Number.isFinite(money) || money < 0) {
            throw new api_error_1.ApiError(400, 'Money received is required');
        }
        const saleDate = data.date instanceof Date ? data.date : new Date(data.date);
        if (Number.isNaN(saleDate.getTime())) {
            throw new api_error_1.ApiError(400, 'Valid sale date is required');
        }
        const record = await this.repository.create({
            ...data,
            amount,
            money,
            date: saleDate,
            recordedBy: data.recordedBy ? new mongoose_1.Types.ObjectId(data.recordedBy) : undefined,
        });
        return this.repository.findById(record._id.toString());
    }
    async getMilkSales(filter = {}) {
        return this.repository.findWithPagination({}, filter);
    }
    async getMilkSaleById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw new api_error_1.ApiError(404, 'Milk sale record not found');
        }
        return record;
    }
    async updateMilkSale(id, data) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw new api_error_1.ApiError(404, 'Milk sale record not found');
        }
        const updatedData = { ...data };
        if (data.amount !== undefined) {
            updatedData.amount = Number(data.amount);
        }
        if (data.money !== undefined) {
            updatedData.money = Number(data.money);
        }
        if (data.date) {
            const saleDate = data.date instanceof Date ? data.date : new Date(data.date);
            if (Number.isNaN(saleDate.getTime())) {
                throw new api_error_1.ApiError(400, 'Valid sale date is required');
            }
            updatedData.date = saleDate;
        }
        const updated = await this.repository.update(id, updatedData);
        if (!updated) {
            throw new api_error_1.ApiError(404, 'Milk sale record not found');
        }
        return this.repository.findById(updated._id.toString());
    }
    async deleteMilkSale(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw new api_error_1.ApiError(404, 'Milk sale record not found');
        }
        await this.repository.delete(id);
        return { message: 'Milk sale record deleted successfully' };
    }
    async getTodayStats() {
        return this.repository.getDailyStats(new Date());
    }
    async getTotalAmount(filter = {}) {
        return this.repository.getTotalAmount(filter);
    }
}
exports.MilkSaleService = MilkSaleService;
