import { Model, Document, FilterQuery, QueryOptions, PopulateOptions, UpdateQuery } from 'mongoose';
import { IBaseRepository, PaginatedResult, QueryParams } from './types';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    return await this.model.insertMany(data) as unknown as T[];
  }

  async findById(id: string, options?: QueryOptions & { populate?: PopulateOptions | PopulateOptions[] }): Promise<T | null> {
    let query: any = this.model.findById(id, options?.projection, options);

    if (options?.populate) {
      query = query.populate(options.populate);
    }

    return await query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    options?: QueryOptions & { populate?: PopulateOptions | PopulateOptions[] }
  ): Promise<T | null> {
    let query: any = this.model.findOne(filter, options?.projection, options);

    if (options?.populate) {
      query = query.populate(options.populate);
    }

    return await query.exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options?: QueryOptions & {
      populate?: PopulateOptions | PopulateOptions[];
      sort?: any;
    }
  ): Promise<T[]> {
    let query: any = this.model.find(filter, options?.projection, options);

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

  async findWithPagination(
    filter: FilterQuery<T> = {},
    queryParams: QueryParams
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, queryParams.page || 1);
    const limit = Math.min(100, queryParams.limit || 10);
    const skip = (page - 1) * limit;

    // Handle sorting
    let sort: Record<string, number> = {};
    if (queryParams.sort) {
      const sortFields = queryParams.sort.split(',').map(field => field.trim());
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sort[field.substring(1)] = -1;
        } else {
          sort[field] = 1;
        }
      });
    } else {
      sort = { createdAt: -1 };
    }

    // Handle field selection
    let projection = {} as any;
    if (queryParams.fields) {
      const fields = queryParams.fields.split(',').map(field => field.trim());
      fields.forEach(field => {
        projection[field] = 1;
      });
    }

    // Remove pagination params from filter
    const { page: _, limit: __, sort: ___, fields: ____, populate, ...actualFilter } = queryParams;

    const [data, total] = await Promise.all([
      this.find(actualFilter as FilterQuery<T>, {
        skip,
        limit,
        sort,
        projection,
        populate: populate as PopulateOptions | PopulateOptions[] | undefined
      }),
      this.count(actualFilter as FilterQuery<T>)
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

  async update(id: string, data: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { ...options, new: true }).exec();
  }

  async updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions): Promise<any> {
    return await this.model.updateMany(filter, data, options).exec();
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<any> {
    return await this.model.deleteMany(filter).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter);
    return !!result;
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).exec();
  }

  // MongoDB specific operations
  async pushToArray(id: string, field: string, value: any): Promise<T | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { $push: { [field]: value } } as any,
      { new: true }
    ).exec();
  }

  async pullFromArray(id: string, field: string, value: any): Promise<T | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { $pull: { [field]: value } } as any,
      { new: true }
    ).exec();
  }

  async incrementField(id: string, field: string, value: number = 1): Promise<T | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { $inc: { [field]: value } } as any,
      { new: true }
    ).exec();
  }

  async bulkWrite(operations: any[]): Promise<any> {
    return await this.model.bulkWrite(operations);
  }
}
