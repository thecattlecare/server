"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const api_response_1 = require("../../utils/api-response");
const health_service_1 = require("./health.service");
const health_validation_1 = require("./health.validation");
class HealthController {
    constructor() {
        this.service = new health_service_1.HealthService();
    }
    async getSummary(req, res) {
        const summary = await this.service.getSummary();
        return res.status(200).json(api_response_1.ApiResponse.success('Health summary fetched successfully', summary));
    }
    async getDiseaseRecords(req, res) {
        const query = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 20,
            status: req.query.status,
            animalId: req.query.animalId,
            search: req.query.search,
        };
        const records = await this.service.getDiseaseRecords(query);
        return res.status(200).json(api_response_1.ApiResponse.success('Disease records fetched successfully', records));
    }
    async getDiseaseRecordById(req, res) {
        const record = await this.service.getDiseaseRecordById(req.params.id);
        return res.status(200).json(api_response_1.ApiResponse.success('Disease record fetched successfully', record));
    }
    async createDiseaseRecord(req, res) {
        const validated = health_validation_1.healthValidation.diseaseCreate.parse({ body: req.body });
        const record = await this.service.createDiseaseRecord(validated.body);
        return res.status(201).json(api_response_1.ApiResponse.success('Disease record created successfully', record));
    }
    async updateDiseaseRecord(req, res) {
        const validated = health_validation_1.healthValidation.diseaseUpdate.parse({ params: req.params, body: req.body });
        const record = await this.service.updateDiseaseRecord(validated.params.id, validated.body);
        return res.status(200).json(api_response_1.ApiResponse.success('Disease record updated successfully', record));
    }
    async deleteDiseaseRecord(req, res) {
        await this.service.deleteDiseaseRecord(req.params.id);
        return res.status(200).json(api_response_1.ApiResponse.success('Disease record deleted successfully'));
    }
    async getVaccinations(req, res) {
        const query = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 20,
            status: req.query.status,
            animalId: req.query.animalId,
            search: req.query.search,
        };
        const records = await this.service.getVaccinations(query);
        return res.status(200).json(api_response_1.ApiResponse.success('Vaccinations fetched successfully', records));
    }
    async getUpcomingVaccinations(req, res) {
        const days = req.query.days ? Number(req.query.days) : 30;
        const records = await this.service.getUpcomingVaccinations(days);
        return res.status(200).json(api_response_1.ApiResponse.success('Upcoming vaccinations fetched successfully', records));
    }
    async createVaccination(req, res) {
        const validated = health_validation_1.healthValidation.vaccinationCreate.parse({ body: req.body });
        const record = await this.service.createVaccination(validated.body);
        return res.status(201).json(api_response_1.ApiResponse.success('Vaccination created successfully', record));
    }
    async updateVaccination(req, res) {
        const validated = health_validation_1.healthValidation.vaccinationUpdate.parse({ params: req.params, body: req.body });
        const record = await this.service.updateVaccination(validated.params.id, validated.body);
        return res.status(200).json(api_response_1.ApiResponse.success('Vaccination updated successfully', record));
    }
    async deleteVaccination(req, res) {
        await this.service.deleteVaccination(req.params.id);
        return res.status(200).json(api_response_1.ApiResponse.success('Vaccination deleted successfully'));
    }
    async getMedicines(req, res) {
        const query = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 50,
            search: req.query.search,
        };
        const records = await this.service.getMedicines(query);
        return res.status(200).json(api_response_1.ApiResponse.success('Medicines fetched successfully', records));
    }
    async createMedicine(req, res) {
        const validated = health_validation_1.healthValidation.medicineCreate.parse({ body: req.body });
        const record = await this.service.createMedicine(validated.body);
        return res.status(201).json(api_response_1.ApiResponse.success('Medicine created successfully', record));
    }
    async updateMedicine(req, res) {
        const validated = health_validation_1.healthValidation.medicineUpdate.parse({ params: req.params, body: req.body });
        const record = await this.service.updateMedicine(validated.params.id, validated.body);
        return res.status(200).json(api_response_1.ApiResponse.success('Medicine updated successfully', record));
    }
    async adjustMedicineStock(req, res) {
        const validated = health_validation_1.healthValidation.stockAdjustment.parse({ params: req.params, body: req.body });
        const record = await this.service.adjustMedicineStock(validated.params.id, validated.body.delta);
        return res.status(200).json(api_response_1.ApiResponse.success('Medicine stock adjusted successfully', record));
    }
    async deleteMedicine(req, res) {
        await this.service.deleteMedicine(req.params.id);
        return res.status(200).json(api_response_1.ApiResponse.success('Medicine deleted successfully'));
    }
}
exports.HealthController = HealthController;
