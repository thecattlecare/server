import { Types } from 'mongoose';
import {
  DiseaseRecord,
  IDiseaseRecord,
  IMedicineStock,
  IVaccinationRecord,
  MedicineStock,
  VaccinationRecord,
} from './health.model';
import { IHealthQuery } from './health.types';

export class HealthRepository {
  async listDiseaseRecords(query: IHealthQuery = {}) {
    const { page = 1, limit = 20, status, animalId, search } = query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (animalId) {
      filter.animalId = new Types.ObjectId(animalId);
    }

    if (search) {
      filter.$or = [
        { disease: { $regex: search, $options: 'i' } },
        { medicine: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      DiseaseRecord.find(filter)
        .populate('animalId', 'name rfid tag')
        .sort({ startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DiseaseRecord.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDiseaseRecordById(id: string) {
    return DiseaseRecord.findById(id).populate('animalId', 'name rfid tag').lean();
  }

  async createDiseaseRecord(payload: Partial<IDiseaseRecord>) {
    return DiseaseRecord.create(payload);
  }

  async updateDiseaseRecord(id: string, payload: Partial<IDiseaseRecord>) {
    return DiseaseRecord.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async deleteDiseaseRecord(id: string) {
    return DiseaseRecord.findByIdAndDelete(id).lean();
  }

  async listVaccinations(query: IHealthQuery = {}) {
    const { page = 1, limit = 20, status, animalId, search } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (animalId) filter.animalId = new Types.ObjectId(animalId);
    if (search) filter.vaccineName = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      VaccinationRecord.find(filter)
        .populate('animalId', 'name rfid tag')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VaccinationRecord.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async listUpcomingVaccinations(days = 30) {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    return VaccinationRecord.find({
      scheduledAt: { $gte: now, $lte: end },
      status: 'Scheduled',
    })
      .populate('animalId', 'name rfid tag')
      .sort({ scheduledAt: 1 })
      .lean();
  }

  async createVaccination(payload: Partial<IVaccinationRecord>) {
    return VaccinationRecord.create(payload);
  }

  async updateVaccination(id: string, payload: Partial<IVaccinationRecord>) {
    return VaccinationRecord.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async deleteVaccination(id: string) {
    return VaccinationRecord.findByIdAndDelete(id).lean();
  }

  async listMedicines(query: IHealthQuery = {}) {
    const { page = 1, limit = 50, search } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { forDisease: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      MedicineStock.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicineStock.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getMedicineById(id: string) {
    return MedicineStock.findById(id).lean();
  }

  async createMedicine(payload: Partial<IMedicineStock>) {
    return MedicineStock.create(payload);
  }

  async updateMedicine(id: string, payload: Partial<IMedicineStock>) {
    return MedicineStock.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  async deleteMedicine(id: string) {
    return MedicineStock.findByIdAndDelete(id).lean();
  }

  async getSummary() {
    const [activeDiseases, criticalDiseases, upcomingVaccinations, medicineItems] = await Promise.all([
      DiseaseRecord.countDocuments({ status: { $in: ['Active', 'Critical', 'Chronic'] } }),
      DiseaseRecord.countDocuments({ status: 'Critical' }),
      VaccinationRecord.countDocuments({
        status: 'Scheduled',
        scheduledAt: { $gte: new Date() },
      }),
      MedicineStock.find({}).lean(),
    ]);

    const lowStock = medicineItems.filter((m) => m.stock <= (m.lowStockThreshold || 0)).length;

    return {
      activeDiseases,
      criticalDiseases,
      upcomingVaccinations,
      lowStockMedicines: lowStock,
      totalMedicines: medicineItems.length,
    };
  }
}
