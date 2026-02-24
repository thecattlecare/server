import { BaseRepository } from '../../utils/base-repository';
import { Animal } from './cattle.model';
import { QueryOptions } from 'mongoose';
import { IAnimal } from './cattle.types';

export class CattleRepository extends BaseRepository<IAnimal> {
  constructor() {
    super(Animal);
  }

  /**
   * Find cattle by tag
   */
  async findByTag(tag: string, options?: QueryOptions): Promise<IAnimal | null> {
    return this.findOne({ tag }, options as any);
  }

  /**
   * Find all active cattle
   */
  async findActive(options?: QueryOptions): Promise<IAnimal[]> {
    return this.find({ isActive: true }, options as any);
  }

  /**
   * Find cattle by breed
   */
  async findByBreed(breed: string, options?: QueryOptions): Promise<IAnimal[]> {
    return this.find({ breed }, options as any);
  }

  /**
   * Find cattle by gender
   */
  async findByGender(gender: string, options?: QueryOptions): Promise<IAnimal[]> {
    return this.find({ gender }, options as any);
  }

  /**
   * Find pregnant cattle
   */
  async findPregnant(options?: QueryOptions): Promise<IAnimal[]> {
    return this.find({ reproductiveStatus: 'pregnant', isActive: true }, options as any);
  }

  /**
   * Find cattle in specific lactation stage
   */
  async findByLactationStage(stage: string, options?: QueryOptions): Promise<IAnimal[]> {
    return this.find({ lactationStage: stage, isActive: true }, options as any);
  }

  /**
   * Deactivate cattle instead of deleting
   */
  async deactivate(id: string): Promise<IAnimal | null> {
    return this.update(id, { isActive: false } as any);
  }

  /**
   * Activate cattle
   */
  async activate(id: string): Promise<IAnimal | null> {
    return this.update(id, { isActive: true } as any);
  }

  /**
   * Get statistics about cattle
   */
  async getStatistics(): Promise<any> {
    return this.aggregate([
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
  }
}
