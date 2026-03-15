"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthRepository = void 0;
const mongoose_1 = require("mongoose");
const health_model_1 = require("./health.model");
class HealthRepository {
    async listDiseaseRecords(query = {}) {
        const { page = 1, limit = 20, status, animalId, search } = query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (animalId) {
            filter.animalId = new mongoose_1.Types.ObjectId(animalId);
        }
        if (search) {
            filter.$or = [
                { disease: { $regex: search, $options: 'i' } },
                { medicine: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            health_model_1.DiseaseRecord.find(filter)
                .populate('animalId', 'name rfid tag')
                .sort({ startDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            health_model_1.DiseaseRecord.countDocuments(filter),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getDiseaseRecordById(id) {
        return health_model_1.DiseaseRecord.findById(id).populate('animalId', 'name rfid tag').lean();
    }
    async createDiseaseRecord(payload) {
        return health_model_1.DiseaseRecord.create(payload);
    }
    async updateDiseaseRecord(id, payload) {
        return health_model_1.DiseaseRecord.findByIdAndUpdate(id, payload, { new: true }).lean();
    }
    async deleteDiseaseRecord(id) {
        return health_model_1.DiseaseRecord.findByIdAndDelete(id).lean();
    }
    async listVaccinations(query = {}) {
        const { page = 1, limit = 20, status, animalId, search } = query;
        const filter = {};
        if (status)
            filter.status = status;
        if (animalId)
            filter.animalId = new mongoose_1.Types.ObjectId(animalId);
        if (search)
            filter.vaccineName = { $regex: search, $options: 'i' };
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            health_model_1.VaccinationRecord.find(filter)
                .populate('animalId', 'name rfid tag')
                .sort({ scheduledAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            health_model_1.VaccinationRecord.countDocuments(filter),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async listUpcomingVaccinations(days = 30) {
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);
        return health_model_1.VaccinationRecord.find({
            scheduledAt: { $gte: now, $lte: end },
            status: 'Scheduled',
        })
            .populate('animalId', 'name rfid tag')
            .sort({ scheduledAt: 1 })
            .lean();
    }
    async createVaccination(payload) {
        return health_model_1.VaccinationRecord.create(payload);
    }
    async updateVaccination(id, payload) {
        return health_model_1.VaccinationRecord.findByIdAndUpdate(id, payload, { new: true }).lean();
    }
    async deleteVaccination(id) {
        return health_model_1.VaccinationRecord.findByIdAndDelete(id).lean();
    }
    async listMedicines(query = {}) {
        const { page = 1, limit = 50, search } = query;
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { forDisease: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            health_model_1.MedicineStock.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            health_model_1.MedicineStock.countDocuments(filter),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getMedicineById(id) {
        return health_model_1.MedicineStock.findById(id).lean();
    }
    async createMedicine(payload) {
        return health_model_1.MedicineStock.create(payload);
    }
    async updateMedicine(id, payload) {
        return health_model_1.MedicineStock.findByIdAndUpdate(id, payload, { new: true }).lean();
    }
    async deleteMedicine(id) {
        return health_model_1.MedicineStock.findByIdAndDelete(id).lean();
    }
    async getSummary() {
        const [activeDiseases, criticalDiseases, upcomingVaccinations, medicineItems] = await Promise.all([
            health_model_1.DiseaseRecord.countDocuments({ status: { $in: ['Active', 'Critical', 'Chronic'] } }),
            health_model_1.DiseaseRecord.countDocuments({ status: 'Critical' }),
            health_model_1.VaccinationRecord.countDocuments({
                status: 'Scheduled',
                scheduledAt: { $gte: new Date() },
            }),
            health_model_1.MedicineStock.find({}).lean(),
        ]);
        const lowStock = medicineItems.filter((m) => m.stock <= (m.lowStockThreshold || 0)).length;
        return {
            activeDiseases,
            criticalDiseases,
            upcomingVaccinations,
            lowStockMedicines: lowStock,
            totalMedicines: medicineItems.length,
        };
    }
}
exports.HealthRepository = HealthRepository;
