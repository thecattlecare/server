"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const mongoose_1 = require("mongoose");
const api_error_1 = require("../../utils/api-error");
const cattle_model_1 = require("../cattle/cattle.model");
const health_repository_1 = require("./health.repository");
class HealthService {
    constructor() {
        this.repository = new health_repository_1.HealthRepository();
    }
    async ensureAnimalExists(animalId) {
        const animal = await cattle_model_1.Animal.findById(animalId);
        if (!animal) {
            throw api_error_1.ApiError.NOT_FOUND('Animal not found');
        }
        return animal;
    }
    async getDiseaseRecords(query) {
        return this.repository.listDiseaseRecords(query);
    }
    async getDiseaseRecordById(id) {
        const record = await this.repository.getDiseaseRecordById(id);
        if (!record) {
            throw api_error_1.ApiError.NOT_FOUND('Disease record not found');
        }
        return record;
    }
    async createDiseaseRecord(payload) {
        await this.ensureAnimalExists(payload.animalId);
        return this.repository.createDiseaseRecord({
            ...payload,
            animalId: new mongoose_1.Types.ObjectId(payload.animalId),
            startDate: payload.startDate instanceof Date ? payload.startDate : new Date(payload.startDate),
            status: payload.status || 'Active',
        });
    }
    async updateDiseaseRecord(id, payload) {
        if (payload.animalId) {
            await this.ensureAnimalExists(payload.animalId);
        }
        const updated = await this.repository.updateDiseaseRecord(id, {
            ...payload,
            animalId: payload.animalId ? new mongoose_1.Types.ObjectId(payload.animalId) : undefined,
            startDate: payload.startDate !== undefined
                ? payload.startDate instanceof Date
                    ? payload.startDate
                    : new Date(payload.startDate)
                : undefined,
        });
        if (!updated) {
            throw api_error_1.ApiError.NOT_FOUND('Disease record not found');
        }
        return updated;
    }
    async deleteDiseaseRecord(id) {
        const deleted = await this.repository.deleteDiseaseRecord(id);
        if (!deleted) {
            throw api_error_1.ApiError.NOT_FOUND('Disease record not found');
        }
        return deleted;
    }
    async getVaccinations(query) {
        return this.repository.listVaccinations(query);
    }
    async getUpcomingVaccinations(days = 30) {
        return this.repository.listUpcomingVaccinations(days);
    }
    async createVaccination(payload) {
        await this.ensureAnimalExists(payload.animalId);
        return this.repository.createVaccination({
            ...payload,
            animalId: new mongoose_1.Types.ObjectId(payload.animalId),
            scheduledAt: payload.scheduledAt instanceof Date ? payload.scheduledAt : new Date(payload.scheduledAt),
            status: payload.status || 'Scheduled',
        });
    }
    async updateVaccination(id, payload) {
        if (payload.animalId) {
            await this.ensureAnimalExists(payload.animalId);
        }
        const updated = await this.repository.updateVaccination(id, {
            ...payload,
            animalId: payload.animalId ? new mongoose_1.Types.ObjectId(payload.animalId) : undefined,
            scheduledAt: payload.scheduledAt !== undefined
                ? payload.scheduledAt instanceof Date
                    ? payload.scheduledAt
                    : new Date(payload.scheduledAt)
                : undefined,
        });
        if (!updated) {
            throw api_error_1.ApiError.NOT_FOUND('Vaccination record not found');
        }
        return updated;
    }
    async deleteVaccination(id) {
        const deleted = await this.repository.deleteVaccination(id);
        if (!deleted) {
            throw api_error_1.ApiError.NOT_FOUND('Vaccination record not found');
        }
        return deleted;
    }
    async getMedicines(query) {
        return this.repository.listMedicines(query);
    }
    async createMedicine(payload) {
        return this.repository.createMedicine(payload);
    }
    async updateMedicine(id, payload) {
        const updated = await this.repository.updateMedicine(id, payload);
        if (!updated) {
            throw api_error_1.ApiError.NOT_FOUND('Medicine item not found');
        }
        return updated;
    }
    async adjustMedicineStock(id, delta) {
        const existing = await this.repository.getMedicineById(id);
        if (!existing) {
            throw api_error_1.ApiError.NOT_FOUND('Medicine item not found');
        }
        const nextStock = existing.stock + delta;
        if (nextStock < 0) {
            throw api_error_1.ApiError.BAD_REQUEST('Stock cannot be negative');
        }
        return this.repository.updateMedicine(id, { stock: nextStock });
    }
    async deleteMedicine(id) {
        const deleted = await this.repository.deleteMedicine(id);
        if (!deleted) {
            throw api_error_1.ApiError.NOT_FOUND('Medicine item not found');
        }
        return deleted;
    }
    async getSummary() {
        return this.repository.getSummary();
    }
}
exports.HealthService = HealthService;
