import { Document, PopulateOptions, QueryOptions } from 'mongoose';

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  findById(id: string, options?: QueryOptions): Promise<T | null>;
  findOne(filter: any, options?: QueryOptions): Promise<T | null>;
  find(filter: any, options?: QueryOptions & { populate?: PopulateOptions | PopulateOptions[] }): Promise<T[]>;
  update(id: string, data: Partial<T>, options?: QueryOptions): Promise<T | null>;
  updateMany(filter: any, data: any, options?: QueryOptions): Promise<any>;
  delete(id: string): Promise<T | null>;
  deleteMany(filter: any): Promise<any>;
  count(filter?: any): Promise<number>;
  exists(filter: any): Promise<boolean>;
  aggregate(pipeline: any[]): Promise<any[]>;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  populate?: string | string[];
  [key: string]: any;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  error?: any;
  pagination?: PaginatedResult<T>['pagination'];
}
