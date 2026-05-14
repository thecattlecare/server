"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedingService = void 0;
const api_error_1 = require("../../utils/api-error");
const feeding_model_1 = require("./feeding.model");
const CRITICAL_THRESHOLD = 50;
class FeedingService {
    async getStocks(query) {
        const filter = { isActive: true };
        if (query.search) {
            const regex = new RegExp(query.search.trim(), 'i');
            filter.$or = [{ name: regex }, { brand: regex }];
        }
        if (query.status === 'critical') {
            filter.stockKg = { $lt: CRITICAL_THRESHOLD };
        }
        else if (query.status === 'ok') {
            filter.stockKg = { $gte: CRITICAL_THRESHOLD };
        }
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
        const records = await feeding_model_1.FeedStock.find(filter)
            .sort({ updatedAt: -1 })
            .lean();
        return records.sort((a, b) => {
            const totalA = a.stockKg * a.unitPrice;
            const totalB = b.stockKg * b.unitPrice;
            if (totalA === totalB)
                return a.name.localeCompare(b.name);
            return sortOrder === 1 ? totalA - totalB : totalB - totalA;
        });
    }
    async createStock(payload) {
        const record = await feeding_model_1.FeedStock.create(payload);
        return feeding_model_1.FeedStock.findById(record._id).lean();
    }
    async updateStock(id, payload) {
        const record = await feeding_model_1.FeedStock.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Feed stock not found');
        return record;
    }
    async adjustStock(id, delta) {
        const record = await feeding_model_1.FeedStock.findById(id);
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Feed stock not found');
        record.stockKg = Math.max(0, record.stockKg + delta);
        await record.save();
        return feeding_model_1.FeedStock.findById(record._id).lean();
    }
    async deleteStock(id) {
        const record = await feeding_model_1.FeedStock.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Feed stock not found');
        return { id, deleted: true };
    }
    async getSchedules(query) {
        const filter = { isActive: true };
        if (query.search) {
            const regex = new RegExp(query.search.trim(), 'i');
            filter.$or = [{ group: regex }, { feedType: regex }, { time: regex }];
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.date) {
            const start = new Date(query.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(query.date);
            end.setHours(23, 59, 59, 999);
            filter.scheduleDate = { $gte: start, $lte: end };
        }
        const sortDirection = query.sortOrder === 'desc' ? -1 : 1;
        return feeding_model_1.FeedSchedule.find(filter)
            .sort({ scheduleDate: sortDirection, time: sortDirection })
            .lean();
    }
    async createSchedule(payload) {
        const record = await feeding_model_1.FeedSchedule.create(payload);
        return feeding_model_1.FeedSchedule.findById(record._id).lean();
    }
    async updateSchedule(id, payload) {
        const record = await feeding_model_1.FeedSchedule.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Feed schedule not found');
        return record;
    }
    async toggleScheduleStatus(id) {
        const existing = await feeding_model_1.FeedSchedule.findById(id);
        if (!existing)
            throw api_error_1.ApiError.NOT_FOUND('Feed schedule not found');
        existing.status = existing.status === 'Pending' ? 'Done' : 'Pending';
        await existing.save();
        return feeding_model_1.FeedSchedule.findById(id).lean();
    }
    async deleteSchedule(id) {
        const record = await feeding_model_1.FeedSchedule.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Feed schedule not found');
        return { id, deleted: true };
    }
    async getSuppliers(query) {
        const filter = { isActive: true };
        if (query.search) {
            const regex = new RegExp(query.search.trim(), 'i');
            filter.$or = [{ name: regex }, { contact: regex }, { feedType: regex }];
        }
        const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
        return feeding_model_1.FeedSupplier.find(filter).sort({ name: sortDirection }).lean();
    }
    async createSupplier(payload) {
        const record = await feeding_model_1.FeedSupplier.create(payload);
        return feeding_model_1.FeedSupplier.findById(record._id).lean();
    }
    async updateSupplier(id, payload) {
        const record = await feeding_model_1.FeedSupplier.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Supplier not found');
        return record;
    }
    async incrementOrders(id) {
        const record = await feeding_model_1.FeedSupplier.findById(id);
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Supplier not found');
        record.orders += 1;
        await record.save();
        return feeding_model_1.FeedSupplier.findById(id).lean();
    }
    async deleteSupplier(id) {
        const record = await feeding_model_1.FeedSupplier.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
        if (!record)
            throw api_error_1.ApiError.NOT_FOUND('Supplier not found');
        return { id, deleted: true };
    }
}
exports.FeedingService = FeedingService;
