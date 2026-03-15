import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error';
import { Animal } from '../cattle/cattle.model';
import { HealthRepository } from './health.repository';
import {
  IDiseaseRecordInput,
  IHealthQuery,
  IMedicineStockInput,
  IVaccinationRecordInput,
} from './health.types';

export class HealthService {
  private repository = new HealthRepository();

  private async ensureAnimalExists(animalId: string | Types.ObjectId) {
    const animal = await Animal.findById(animalId);
    if (!animal) {
      throw ApiError.NOT_FOUND('Animal not found');
    }
    return animal;
  }

  async getDiseaseRecords(query: IHealthQuery) {
    return this.repository.listDiseaseRecords(query);
  }

  async getDiseaseRecordById(id: string) {
    const record = await this.repository.getDiseaseRecordById(id);
    if (!record) {
      throw ApiError.NOT_FOUND('Disease record not found');
    }
    return record;
  }

  async createDiseaseRecord(payload: IDiseaseRecordInput) {
    await this.ensureAnimalExists(payload.animalId);

    return this.repository.createDiseaseRecord({
      ...payload,
      animalId: new Types.ObjectId(payload.animalId as string),
      startDate: payload.startDate instanceof Date ? payload.startDate : new Date(payload.startDate),
      status: payload.status || 'Active',
    } as any);
  }

  async updateDiseaseRecord(id: string, payload: Partial<IDiseaseRecordInput>) {
    if (payload.animalId) {
      await this.ensureAnimalExists(payload.animalId);
    }

    const updated = await this.repository.updateDiseaseRecord(id, {
      ...payload,
      animalId: payload.animalId ? new Types.ObjectId(payload.animalId as string) : undefined,
      startDate:
        payload.startDate !== undefined
          ? payload.startDate instanceof Date
            ? payload.startDate
            : new Date(payload.startDate)
          : undefined,
    } as any);

    if (!updated) {
      throw ApiError.NOT_FOUND('Disease record not found');
    }

    return updated;
  }

  async deleteDiseaseRecord(id: string) {
    const deleted = await this.repository.deleteDiseaseRecord(id);
    if (!deleted) {
      throw ApiError.NOT_FOUND('Disease record not found');
    }
    return deleted;
  }

  async getVaccinations(query: IHealthQuery) {
    return this.repository.listVaccinations(query);
  }

  async getUpcomingVaccinations(days = 30) {
    return this.repository.listUpcomingVaccinations(days);
  }

  async createVaccination(payload: IVaccinationRecordInput) {
    await this.ensureAnimalExists(payload.animalId);

    return this.repository.createVaccination({
      ...payload,
      animalId: new Types.ObjectId(payload.animalId as string),
      scheduledAt: payload.scheduledAt instanceof Date ? payload.scheduledAt : new Date(payload.scheduledAt),
      status: payload.status || 'Scheduled',
    } as any);
  }

  async updateVaccination(id: string, payload: Partial<IVaccinationRecordInput>) {
    if (payload.animalId) {
      await this.ensureAnimalExists(payload.animalId);
    }

    const updated = await this.repository.updateVaccination(id, {
      ...payload,
      animalId: payload.animalId ? new Types.ObjectId(payload.animalId as string) : undefined,
      scheduledAt:
        payload.scheduledAt !== undefined
          ? payload.scheduledAt instanceof Date
            ? payload.scheduledAt
            : new Date(payload.scheduledAt)
          : undefined,
    } as any);

    if (!updated) {
      throw ApiError.NOT_FOUND('Vaccination record not found');
    }

    return updated;
  }

  async deleteVaccination(id: string) {
    const deleted = await this.repository.deleteVaccination(id);
    if (!deleted) {
      throw ApiError.NOT_FOUND('Vaccination record not found');
    }
    return deleted;
  }

  async getMedicines(query: IHealthQuery) {
    return this.repository.listMedicines(query);
  }

  async createMedicine(payload: IMedicineStockInput) {
    return this.repository.createMedicine(payload as any);
  }

  async updateMedicine(id: string, payload: Partial<IMedicineStockInput>) {
    const updated = await this.repository.updateMedicine(id, payload as any);
    if (!updated) {
      throw ApiError.NOT_FOUND('Medicine item not found');
    }
    return updated;
  }

  async adjustMedicineStock(id: string, delta: number) {
    const existing = await this.repository.getMedicineById(id);
    if (!existing) {
      throw ApiError.NOT_FOUND('Medicine item not found');
    }

    const nextStock = existing.stock + delta;
    if (nextStock < 0) {
      throw ApiError.BAD_REQUEST('Stock cannot be negative');
    }

    return this.repository.updateMedicine(id, { stock: nextStock } as any);
  }

  async deleteMedicine(id: string) {
    const deleted = await this.repository.deleteMedicine(id);
    if (!deleted) {
      throw ApiError.NOT_FOUND('Medicine item not found');
    }
    return deleted;
  }

  async getSummary() {
    return this.repository.getSummary();
  }
}
