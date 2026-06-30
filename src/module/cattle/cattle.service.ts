import { CattleRepository } from './cattle.repository';
import { CreateCattleInput, UpdateCattleInput } from './cattle.types';
import { ApiError } from '../../utils/api-error';
import { PaginatedResult, QueryParams } from '../../utils/types';
import { IAnimal } from './cattle.types';
import { FilterQuery } from 'mongoose';
import { broadcastNotification } from '../../utils/notifications';

export class CattleService {
  private cattleRepository: CattleRepository;

  constructor() {
    this.cattleRepository = new CattleRepository();
  }

  /**
   * Create a new cattle
   */
  async createCattle(data: CreateCattleInput): Promise<IAnimal> {
    // Check if tag already exists (if provided)
    if (data.tag) {
      const existing = await this.cattleRepository.findByTag(data.tag);
      if (existing) {
        throw ApiError.BAD_REQUEST(`Cattle with tag "${data.tag}" already exists`);
      }
    }

    const cattle = await this.cattleRepository.create(data as any);
    if (cattle.dam) {
      const res = await this.cattleRepository.findById(cattle.dam as any)
      if (res?.group === 'Heifer') {
        const heifer = await this.cattleRepository.update(res._id, {
          group: 'Cow',
          parity: 1,
          lactationStage: 'Early',
          reproductiveStatus: 'Open'
        })
        broadcastNotification('cattle', {
          direction: 'positive',
          message: `Heifer "${heifer?.name}" is promoted to Cow, after its first calving!`,
          createdAt: new Date().toISOString(),
        })
      } else if (res?.group === 'Cow') {
        const cow = await this.cattleRepository.update(res._id, {
          parity: res?.parity ? res?.parity + 1 : 1,
          lactationStage: 'Early',
          reproductiveStatus: 'Open'
        })
        broadcastNotification('cattle', {
          direction: 'positive',
          message: `Cattle "${cow?.name}" is promoted to parity # ${cow?.parity}!`,
          createdAt: new Date().toISOString(),
        })
      }
    }
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
    const cattle = await this.cattleRepository.findById(id, {
      populate: [
        { path: 'dam', select: 'name' },
        { path: 'sire', select: 'name' }
      ]
    });
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }
    return cattle;
  }

  /**
   * Update cattle
   */
  async updateCattle(id: string, data: UpdateCattleInput): Promise<IAnimal> {
    // Verify cattle exists
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }

    // Check for tag uniqueness if tag is being updated
    if (data.tag && data.tag !== cattle.tag) {
      const existing = await this.cattleRepository.findByTag(data.tag);
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

  /**
   * Delete cattle (soft delete - deactivate)
   */
  async deleteCattle(id: string): Promise<IAnimal> {
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }

    const deleted = await this.cattleRepository.deactivate(id);
    if (!deleted) {
      throw ApiError.INTERNAL_SERVER_ERROR('Failed to delete cattle');
    }

    return deleted;
  }

  /**
   * Reactivate cattle
   */
  async reactivateCattle(id: string): Promise<IAnimal> {
    const cattle = await this.cattleRepository.findById(id);
    if (!cattle) {
      throw ApiError.NOT_FOUND('Cattle not found');
    }

    const activated = await this.cattleRepository.activate(id);
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

  /**
   * Get pregnant cattle
   */
  async getPregnantCattle(queryParams: QueryParams): Promise<PaginatedResult<IAnimal>> {
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
  async getCattleByBreed(breed: string, queryParams: QueryParams): Promise<PaginatedResult<IAnimal>> {
    const filters: FilterQuery<IAnimal> = { breed };
    if (queryParams.isActive !== undefined) {
      filters.isActive = queryParams.isActive as any;
    }

    const result = await this.cattleRepository.findWithPagination(filters, queryParams);
    return result;
  }

  /**
   * Get cattle statistics
   */
  async getCattleStatistics(): Promise<any> {
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
  async searchByTag(tag: string): Promise<IAnimal | null> {
    return this.cattleRepository.findByTag(tag);
  }
}
