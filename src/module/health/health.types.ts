import { Types } from 'mongoose';

export type DiseaseStatus = 'Active' | 'Critical' | 'Chronic' | 'Recovered';
export type VaccinationStatus = 'Scheduled' | 'Completed' | 'Missed';

export interface IDiseaseRecordInput {
  animalId: string | Types.ObjectId;
  disease: string;
  treatment?: string;
  medicine?: string;
  treatmentCost?: number;
  status?: DiseaseStatus;
  startDate: Date | string;
  notes?: string;
}

export interface IVaccinationRecordInput {
  animalId: string | Types.ObjectId;
  vaccineName: string;
  dose: string;
  scheduledAt: Date | string;
  status?: VaccinationStatus;
  notes?: string;
}

export interface IMedicineStockInput {
  name: string;
  type?: string;
  dose?: string;
  stock: number;
  forDisease?: string;
  lowStockThreshold?: number;
}

export interface IHealthQuery {
  page?: number;
  limit?: number;
  status?: string;
  animalId?: string;
  search?: string;
}
