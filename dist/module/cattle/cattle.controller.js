"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CattleController = void 0;
const cattle_service_1 = require("./cattle.service");
const cattle_types_1 = require("./cattle.types");
const validation_1 = require("../../utils/validation");
const api_response_1 = require("../../utils/api-response");
const api_error_1 = require("../../utils/api-error");
class CattleController {
    constructor() {
        this.cattleService = new cattle_service_1.CattleService();
    }
    /**
     * Create new cattle
     * POST /cattle
     */
    async createCattle(req, res) {
        try {
            const validatedData = cattle_types_1.createCattleSchema.parse(req.body);
            const cattle = await this.cattleService.createCattle(validatedData);
            return res.status(201).json(api_response_1.ApiResponse.success('Cattle created successfully', cattle));
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Create multiple cattle
     * POST /cattle/bulk
     */
    async createBulkCattle(req, res) {
        try {
            if (!Array.isArray(req.body)) {
                throw api_error_1.ApiError.BAD_REQUEST('Request body must be an array');
            }
            const validatedData = req.body.map((item) => cattle_types_1.createCattleSchema.parse(item));
            const cattle = await this.cattleService.createBulkCattle(validatedData);
            return res.status(201).json(api_response_1.ApiResponse.success(`${cattle.length} cattle created successfully`, cattle));
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Get all cattle with pagination
     * GET /cattle
     */
    async getAllCattle(req, res) {
        try {
            const validatedQuery = cattle_types_1.cattleQuerySchema.parse(req.query);
            const result = await this.cattleService.getAllCattle(validatedQuery);
            return res.status(200).json({
                success: true,
                message: 'Cattle retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Get cattle by ID
     * GET /cattle/:id
     */
    async getCattleById(req, res) {
        try {
            const { id } = validation_1.idParamSchema.parse(req.params);
            const cattle = await this.cattleService.getCattleById(id);
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle retrieved successfully', cattle));
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST('Invalid cattle ID');
            }
            throw error;
        }
    }
    /**
     * Update cattle
     * PATCH /cattle/:id
     */
    async updateCattle(req, res) {
        try {
            const { id } = validation_1.idParamSchema.parse(req.params);
            const validatedData = cattle_types_1.updateCattleSchema.parse(req.body);
            const cattle = await this.cattleService.updateCattle(id, validatedData);
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle updated successfully', cattle));
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Delete cattle (soft delete)
     * DELETE /cattle/:id
     */
    async deleteCattle(req, res) {
        try {
            const { id } = validation_1.idParamSchema.parse(req.params);
            const cattle = await this.cattleService.deleteCattle(id);
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle deleted successfully', cattle));
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST('Invalid cattle ID');
            }
            throw error;
        }
    }
    /**
     * Reactivate cattle
     * PATCH /cattle/:id/reactivate
     */
    async reactivateCattle(req, res) {
        try {
            const { id } = validation_1.idParamSchema.parse(req.params);
            const cattle = await this.cattleService.reactivateCattle(id);
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle reactivated successfully', cattle));
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST('Invalid cattle ID');
            }
            throw error;
        }
    }
    /**
     * Get active cattle
     * GET /cattle/active
     */
    async getActiveCattle(req, res) {
        try {
            const validatedQuery = cattle_types_1.cattleQuerySchema.parse(req.query);
            const result = await this.cattleService.getActiveCattle(validatedQuery);
            return res.status(200).json({
                success: true,
                message: 'Active cattle retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Get pregnant cattle
     * GET /cattle/pregnant
     */
    async getPregnantCattle(req, res) {
        try {
            const validatedQuery = cattle_types_1.cattleQuerySchema.parse(req.query);
            const result = await this.cattleService.getPregnantCattle(validatedQuery);
            return res.status(200).json({
                success: true,
                message: 'Pregnant cattle retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Get cattle by breed
     * GET /cattle/breed/:breed
     */
    async getCattleByBreed(req, res) {
        try {
            const { breed } = req.params;
            if (!breed) {
                throw api_error_1.ApiError.BAD_REQUEST('Breed is required');
            }
            const validatedQuery = cattle_types_1.cattleQuerySchema.parse(req.query);
            const result = await this.cattleService.getCattleByBreed(breed, validatedQuery);
            return res.status(200).json({
                success: true,
                message: 'Cattle by breed retrieved successfully',
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                throw api_error_1.ApiError.BAD_REQUEST(error.errors[0].message);
            }
            throw error;
        }
    }
    /**
     * Get cattle statistics
     * GET /cattle/stats/overview
     */
    async getCattleStatistics(req, res) {
        try {
            const stats = await this.cattleService.getCattleStatistics();
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle statistics retrieved successfully', stats));
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Search cattle by tag
     * GET /cattle/search/:tag
     */
    async searchByTag(req, res) {
        try {
            const { tag } = req.params;
            if (!tag) {
                throw api_error_1.ApiError.BAD_REQUEST('Tag is required');
            }
            const cattle = await this.cattleService.searchByTag(tag);
            if (!cattle) {
                return res.status(404).json(api_response_1.ApiResponse.error('Cattle not found'));
            }
            return res.status(200).json(api_response_1.ApiResponse.success('Cattle found', cattle));
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CattleController = CattleController;
