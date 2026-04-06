import { BaseRepository } from '../../utils/base-repository';
import { Animal } from './cattle.model';
import { CreateCattleInput, UpdateCattleInput } from './cattle.types';
import { ApiError } from '../../utils/api-error';
import { PaginatedResult, QueryParams } from '../../utils/types';
import { IAnimal } from './cattle.types';
import { FilterQuery } from 'mongoose';

export class CattleService {
  private cattleRepository: BaseRepository<IAnimal>;

  constructor() {
    this.cattleRepository = new BaseRepository(Animal);
  }

  async createCattle(data: CreateCattleInput): Promise<IAnimal> {
    // Check if tag already exists (if provided)
    if (data.tag) {
      const existing = await this.cattleRepository.findOne({ tag: data.tag } as any);
      if (existing) {
        throw ApiError.BAD_REQUEST(`Cattle with tag "${data.tag}" already exists`);
      }
    }

    const cattle = await this.cattleRepository.create(data as any);
    return cattle;
  }

  /**
   * Create multiple cattle
   */
  async createBulkCattle(data: CreateCattleInput[]): Promise<IAnimal[]> {
    if (data.length === 0) {
      throw ApiError.BAD_REQUEST('No cattle data provided');
    }

    // Check for duplicate tags
    const tags = data
      .filter(item => item.tag)
      .map(item => item.tag!);

    if (tags.length !== new Set(tags).size) {
      throw ApiError.BAD_REQUEST('Duplicate tags found in bulk creation');
    }

    const cattle = await this.cattleRepository.createMany(data as any);
    return cattle;
  }

  /**
   * Get all cattle with pagination
   */
  async getAllCattle(queryParams: QueryParams): Promise<PaginatedResult<IAnimal>> {
    const filters: FilterQuery<IAnimal> = {};

    // Apply filters
    if (queryParams.tag) filters.tag = queryParams.tag;
    if (queryParams.breed) filters.breed = { $regex: queryParams.breed, $options: 'i' };
    if (queryParams.gender) filters.gender = queryParams.gender;
    if (queryParams.isActive !== undefined) filters.isActive = queryParams.isActive as any;

    const result = await this.cattleRepository.findWithPagination(filters, queryParams);
    return result;
  }

  /**
   * Get cattle by ID
   */
  async getCattleById(id: string): Promise<IAnimal> {
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }
    return cattle;
  }

  async updateCattle(id: string, data: UpdateCattleInput): Promise<IAnimal> {
    // Verify cattle exists
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }

    // Check for tag uniqueness if tag is being updated
    if (data.tag && data.tag !== cattle.tag) {
      const existing = await this.cattleRepository.findOne({ tag: data.tag } as any);
      if (existing) {
        throw ApiError.BAD_REQUEST(`Cattle with tag "${data.tag}" already exists`);
      }
    }

    const updated = await this.cattleRepository.update(id, data as any);
    if (!updated) {
      throw ApiError.INTERNAL_SERVER_ERROR('Failed to update cattle');
    }

    return updated;
  }

  async deleteCattle(id: string): Promise<IAnimal> {
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }

    const deleted = await this.cattleRepository.update(id, { isActive: false } as any);
    if (!deleted) {
      throw ApiError.INTERNAL_SERVER_ERROR('Failed to delete cattle');
    }

    return deleted;
  }

  async reactivateCattle(id: string): Promise<IAnimal> {
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }

    const activated = await this.cattleRepository.update(id, { isActive: true } as any);
    if (!activated) {
      throw ApiError.INTERNAL_SERVER_ERROR('Failed to reactivate cattle');
    }

    return activated;
  }

  /**
   * Get active cattle
   */
  async getActiveCattle(queryParams: QueryParams): Promise<PaginatedResult<IAnimal>> {
    return this.getAllCattle({ ...queryParams, isActive: true } as any);
  }

  async getPregnantCattle(queryParams: QueryParams): Promise<PaginatedResult<IAnimal>> {
    const filters: FilterQuery<IAnimal> = { reproductiveStatus: 'pregnant', isActive: true };
    const result = await this.cattleRepository.findWithPagination(filters, queryParams);
    return result;
  }

  /**
   * Get cattle by breed
   */
  async getCattleByBreed(breed: string, queryParams: QueryParams): Promise<PaginatedResult<IAnimal>> {
    const filters: FilterQuery<IAnimal> = { breed };
    if (queryParams.isActive !== undefined) {
      filters.isActive = queryParams.isActive as any;
    }

    const result = await this.cattleRepository.findWithPagination(filters, queryParams);
    return result;
  }

  async getCattleStatistics(): Promise<any> {
    const stats = await this.cattleRepository.aggregate([
      {
        $group: {
          _id: null,
          totalCattle: { $sum: 1 },
          activeCattle: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
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
    if (!stats || stats.length === 0) {
      return {
        totalCattle: 0,
        activeCattle: 0,
        avgWeight: 0,
        averagePrice: 0,
      };
    }

    return stats[0];
  }

  async searchByTag(tag: string): Promise<IAnimal | null> {
    return this.cattleRepository.findOne({ tag } as any);
  }
}
