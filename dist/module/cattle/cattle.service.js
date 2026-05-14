"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CattleService = void 0;
const cattle_repository_1 = require("./cattle.repository");
const api_error_1 = require("../../utils/api-error");
class CattleService {
    constructor() {
        this.cattleRepository = new cattle_repository_1.CattleRepository();
    }
    /**
     * Create a new cattle
     */
    async createCattle(data) {
        // Check if tag already exists (if provided)
        if (data.tag) {
            const existing = await this.cattleRepository.findByTag(data.tag);
            if (existing) {
                throw api_error_1.ApiError.BAD_REQUEST(`Cattle with tag "${data.tag}" already exists`);
            }
        }
        const cattle = await this.cattleRepository.create(data);
        return cattle;
    }
    /**
     * Create multiple cattle
     */
    async createBulkCattle(data) {
        if (data.length === 0) {
            throw api_error_1.ApiError.BAD_REQUEST('No cattle data provided');
        }
        // Check for duplicate tags
        const tags = data
            .filter(item => item.tag)
            .map(item => item.tag);
        if (tags.length !== new Set(tags).size) {
            throw api_error_1.ApiError.BAD_REQUEST('Duplicate tags found in bulk creation');
        }
        const cattle = await this.cattleRepository.createMany(data);
        return cattle;
    }
    /**
     * Get all cattle with pagination
     */
    async getAllCattle(queryParams) {
        const filters = {};
        // Apply filters
        if (queryParams.tag)
            filters.tag = queryParams.tag;
        if (queryParams.breed)
            filters.breed = { $regex: queryParams.breed, $options: 'i' };
        if (queryParams.gender)
            filters.gender = queryParams.gender;
        if (queryParams.isActive !== undefined)
            filters.isActive = queryParams.isActive;
        const result = await this.cattleRepository.findWithPagination(filters, queryParams);
        return result;
    }
    /**
     * Get cattle by ID
     */
    async getCattleById(id) {
        const cattle = await this.cattleRepository.findById(id);
        if (!cattle) {
            throw api_error_1.ApiError.NOT_FOUND('Cattle not found');
        }
        return cattle;
    }
    /**
     * Update cattle
     */
    async updateCattle(id, data) {
        // Verify cattle exists
        const cattle = await this.cattleRepository.findById(id);
        if (!cattle) {
            throw api_error_1.ApiError.NOT_FOUND('Cattle not found');
        }
        // Check for tag uniqueness if tag is being updated
        if (data.tag && data.tag !== cattle.tag) {
            const existing = await this.cattleRepository.findByTag(data.tag);
            if (existing) {
                throw api_error_1.ApiError.BAD_REQUEST(`Cattle with tag "${data.tag}" already exists`);
            }
        }
        const updated = await this.cattleRepository.update(id, data);
        if (!updated) {
            throw api_error_1.ApiError.INTERNAL_SERVER_ERROR('Failed to update cattle');
        }
        return updated;
    }
    /**
     * Delete cattle (soft delete - deactivate)
     */
    async deleteCattle(id) {
        const cattle = await this.cattleRepository.findById(id);
        if (!cattle) {
            throw api_error_1.ApiError.NOT_FOUND('Cattle not found');
        }
        const deleted = await this.cattleRepository.deactivate(id);
        if (!deleted) {
            throw api_error_1.ApiError.INTERNAL_SERVER_ERROR('Failed to delete cattle');
        }
        return deleted;
    }
    /**
     * Reactivate cattle
     */
    async reactivateCattle(id) {
        const cattle = await this.cattleRepository.findById(id);
        if (!cattle) {
            throw api_error_1.ApiError.NOT_FOUND('Cattle not found');
        }
        const activated = await this.cattleRepository.activate(id);
        if (!activated) {
            throw api_error_1.ApiError.INTERNAL_SERVER_ERROR('Failed to reactivate cattle');
        }
        return activated;
    }
    /**
     * Get active cattle
     */
    async getActiveCattle(queryParams) {
        return this.getAllCattle({ ...queryParams, isActive: true });
    }
    /**
     * Get pregnant cattle
     */
    async getPregnantCattle(queryParams) {
        const pregnant = await this.cattleRepository.findPregnant({
            skip: ((queryParams.page || 1) - 1) * (queryParams.limit || 10),
            limit: queryParams.limit || 10,
        });
        const total = await this.cattleRepository.count({ reproductiveStatus: 'Pregnant', isActive: true });
        const limit = queryParams.limit || 10;
        const pages = Math.ceil(total / limit);
        const page = queryParams.page || 1;
        return {
            data: pregnant,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1,
            },
        };
    }
    /**
     * Get cattle by breed
     */
    async getCattleByBreed(breed, queryParams) {
        const filters = { breed };
        if (queryParams.isActive !== undefined) {
            filters.isActive = queryParams.isActive;
        }
        const result = await this.cattleRepository.findWithPagination(filters, queryParams);
        return result;
    }
    /**
     * Get cattle statistics
     */
    async getCattleStatistics() {
        const stats = await this.cattleRepository.getStatistics();
        if (!stats || stats.length === 0) {
            return {
                totalCattle: 0,
                activeCattle: 0,
                pregnantCattle: 0,
                sickAnimals: 0,
                avgWeight: 0,
                averagePrice: 0,
            };
        }
        return stats[0];
    }
    /**
     * Search cattle by tag
     */
    async searchByTag(tag) {
        return this.cattleRepository.findByTag(tag);
    }
}
exports.CattleService = CattleService;
