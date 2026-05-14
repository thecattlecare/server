"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        const document = new this.model(data);
        return await document.save();
    }
    async createMany(data) {
        return await this.model.insertMany(data);
    }
    async findById(id, options) {
        let query = this.model.findById(id, options?.projection, options);
        if (options?.populate) {
            query = query.populate(options.populate);
        }
        return await query.exec();
    }
    async findOne(filter, options) {
        let query = this.model.findOne(filter, options?.projection, options);
        if (options?.populate) {
            query = query.populate(options.populate);
        }
        return await query.exec();
    }
    async find(filter = {}, options) {
        let query = this.model.find(filter, options?.projection, options);
        if (options?.sort) {
            query = query.sort(options.sort);
        }
        if (options?.populate) {
            query = query.populate(options.populate);
        }
        if (options?.skip) {
            query = query.skip(options.skip);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        return await query.exec();
    }
    async findWithPagination(filter = {}, queryParams) {
        const page = Math.max(1, queryParams.page || 1);
        const limit = Math.min(100, queryParams.limit || 10);
        const skip = (page - 1) * limit;
        // Handle sorting
        let sort = {};
        if (queryParams.sort) {
            const sortFields = queryParams.sort.split(',').map(field => field.trim());
            sortFields.forEach(field => {
                if (field.startsWith('-')) {
                    sort[field.substring(1)] = -1;
                }
                else {
                    sort[field] = 1;
                }
            });
        }
        else {
            sort = { createdAt: -1 };
        }
        // Handle field selection
        let projection = {};
        if (queryParams.fields) {
            const fields = queryParams.fields.split(',').map(field => field.trim());
            fields.forEach(field => {
                projection[field] = 1;
            });
        }
        // Remove pagination params from filter
        const { page: _, limit: __, sort: ___, fields: ____, populate, ...actualFilter } = queryParams;
        const [data, total] = await Promise.all([
            this.find(actualFilter, {
                skip,
                limit,
                sort,
                projection,
                populate: populate
            }),
            this.count(actualFilter)
        ]);
        const pages = Math.ceil(total / limit);
        const hasNext = page < pages;
        const hasPrev = page > 1;
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext,
                hasPrev
            }
        };
    }
    async update(id, data, options) {
        return await this.model.findByIdAndUpdate(id, data, { ...options, new: true }).exec();
    }
    async updateMany(filter, data, options) {
        return await this.model.updateMany(filter, data, options).exec();
    }
    async delete(id) {
        return await this.model.findByIdAndDelete(id).exec();
    }
    async deleteMany(filter) {
        return await this.model.deleteMany(filter).exec();
    }
    async count(filter = {}) {
        return await this.model.countDocuments(filter).exec();
    }
    async exists(filter) {
        const result = await this.model.exists(filter);
        return !!result;
    }
    async aggregate(pipeline) {
        return await this.model.aggregate(pipeline).exec();
    }
    // MongoDB specific operations
    async pushToArray(id, field, value) {
        return await this.model.findByIdAndUpdate(id, { $push: { [field]: value } }, { new: true }).exec();
    }
    async pullFromArray(id, field, value) {
        return await this.model.findByIdAndUpdate(id, { $pull: { [field]: value } }, { new: true }).exec();
    }
    async incrementField(id, field, value = 1) {
        return await this.model.findByIdAndUpdate(id, { $inc: { [field]: value } }, { new: true }).exec();
    }
    async bulkWrite(operations) {
        return await this.model.bulkWrite(operations);
    }
}
exports.BaseRepository = BaseRepository;
