"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CattleRepository = void 0;
const base_repository_1 = require("../../utils/base-repository");
const cattle_model_1 = require("./cattle.model");
class CattleRepository extends base_repository_1.BaseRepository {
    constructor() {
        // The model file and types file currently define separate IAnimal interfaces.
        // Cast to the repository contract to keep compile-time types consistent here.
        super(cattle_model_1.Animal);
    }
    /**
     * Find cattle by tag
     */
    async findByTag(tag, options) {
        return this.findOne({ tag }, options);
    }
    /**
     * Find all active cattle
     */
    async findActive(options) {
        return this.find({ isActive: true }, options);
    }
    /**
     * Find cattle by breed
     */
    async findByBreed(breed, options) {
        return this.find({ breed }, options);
    }
    /**
     * Find cattle by gender
     */
    async findByGender(gender, options) {
        return this.find({ gender }, options);
    }
    /**
     * Find pregnant cattle
     */
    async findPregnant(options) {
        return this.find({ reproductiveStatus: 'Pregnant', isActive: true }, options);
    }
    /**
     * Find cattle in specific lactation stage
     */
    async findByLactationStage(stage, options) {
        return this.find({ lactationStage: stage, isActive: true }, options);
    }
    /**
     * Deactivate cattle instead of deleting
     */
    async deactivate(id) {
        return this.update(id, { isActive: false });
    }
    /**
     * Activate cattle
     */
    async activate(id) {
        return this.update(id, { isActive: true });
    }
    /**
     * Get statistics about cattle
     */
    async getStatistics() {
        return this.aggregate([
            {
                $group: {
                    _id: null,
                    totalCattle: { $sum: 1 },
                    activeCattle: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
                    },
                    pregnantCattle: {
                        $sum: { $cond: [{ $and: [{ $eq: ['$reproductiveStatus', 'Pregnant'] }, { $eq: ['$isActive', true] }] }, 1, 0] },
                    },
                    sickAnimals: {
                        $sum: { $cond: [{ $and: [{ $ne: ['$healthStatus', 'Healthy'] }, { $ne: ['$healthStatus', null] }, { $eq: ['$isActive', true] }] }, 1, 0] },
                    },
                    byGender: {
                        $push: {
                            gender: '$gender',
                            count: 1,
                        },
                    },
                    byBreed: {
                        $push: {
                            breed: '$breed',
                            count: 1,
                        },
                    },
                    avgWeight: { $avg: '$weight' },
                    averagePrice: { $avg: '$purchasePrice' },
                },
            },
        ]);
    }
}
exports.CattleRepository = CattleRepository;
