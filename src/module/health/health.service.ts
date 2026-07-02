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
import { createAndBroadcastNotification } from '../../module/notification/notification.service';

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
      treatment: payload.treatment || payload.medicine || '',
      animalId: new Types.ObjectId(payload.animalId as string),
      startDate: payload.startDate instanceof Date ? payload.startDate : new Date(payload.startDate),
      status: payload.status || 'Active',
      treatmentCost: Number(payload.treatmentCost ?? 0),
    } as any);
  }

  async updateDiseaseRecord(id: string, payload: Partial<IDiseaseRecordInput>) {
    if (payload.animalId) {
      await this.ensureAnimalExists(payload.animalId);
    }

    // Fetch existing to detect status changes
    const existing = await this.repository.getDiseaseRecordById(id as string);

    const updated = await this.repository.updateDiseaseRecord(id, {
      ...payload,
      treatment: payload.treatment ?? payload.medicine,
      animalId: payload.animalId ? new Types.ObjectId(payload.animalId as string) : undefined,
      startDate:
        payload.startDate !== undefined
          ? payload.startDate instanceof Date
            ? payload.startDate
            : new Date(payload.startDate)
          : undefined,
      treatmentCost: payload.treatmentCost !== undefined ? Number(payload.treatmentCost) : undefined,
    } as any);

    if (!updated) {
      throw ApiError.NOT_FOUND('Disease record not found');
    }

    try {
      if (existing && existing.status !== updated.status) {
        // Get animal name - handle both populated and non-populated cases
        let animalName = 'Animal';

        // Check if animalId is populated with name
        if (existing.animalId && typeof existing.animalId === 'object' && 'name' in existing.animalId) {
          animalName = (existing.animalId as any).name;
        }

        // Determine status direction based on health progression
        const statusHierarchy = {
          'Critical': 0,
          'Active': 1,
          'Chronic': 2,
          'Recovered': 3
        };

        const previousStatus = existing.status;
        const newStatus = updated.status;
        const previousLevel = statusHierarchy[previousStatus as keyof typeof statusHierarchy] ?? 1;
        const newLevel = statusHierarchy[newStatus as keyof typeof statusHierarchy] ?? 1;

        let direction: 'positive' | 'negative' | 'neutral';

        if (newLevel > previousLevel) {
          direction = 'positive'; // Health is improving
        } else if (newLevel < previousLevel) {
          direction = 'negative'; // Health is deteriorating
        } else {
          direction = 'neutral'; // No change in severity level
        }

        void createAndBroadcastNotification({
          type: 'health',
          direction,
          message: `Cattle "${animalName}" health updated. Status changed from ${previousStatus} to ${newStatus}`,
        });
      }
    } catch (err) {
      console.error('Failed to broadcast health-status-update:', err);
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

    const record = await this.repository.createVaccination({
      ...payload,
      animalId: new Types.ObjectId(payload.animalId as string),
      scheduledAt: payload.scheduledAt instanceof Date ? payload.scheduledAt : new Date(payload.scheduledAt),
      status: payload.status || 'Scheduled',
    } as any);

    try {
      const now = new Date();
      const scheduled = new Date(record.scheduledAt as any);
      const eightHours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      if (scheduled >= now && scheduled <= eightHours) {
        void createAndBroadcastNotification({
          type: 'vaccination',
          direction: 'neutral',
          message: `A scheduled vaccination ${record.vaccineName} is upcoming, on ${record.scheduledAt}`,
          metadata: { vaccinationId: String(record._id) },
        });
      }
    } catch (err) {
      console.error('Failed to broadcast vaccination-upcoming on create:', err);
    }

    return record;
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

    try {
      const now = new Date();
      const scheduled = new Date(updated.scheduledAt as any);
      const eightHours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      if (scheduled >= now && scheduled <= eightHours) {
        void createAndBroadcastNotification({
          type: 'vaccination',
          direction: 'neutral',
          message: `A scheduled vaccination ${updated.vaccineName} is upcoming, on ${updated.scheduledAt}`,
          metadata: { vaccinationId: String(updated._id) },
        });
      }
    } catch (err) {
      console.error('Failed to broadcast vaccination-upcoming on update:', err);
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
