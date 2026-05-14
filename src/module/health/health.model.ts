import mongoose, { Document, Schema } from 'mongoose';
import { DiseaseStatus, VaccinationStatus } from './health.types';

export interface IDiseaseRecord extends Document {
  animalId: mongoose.Types.ObjectId;
  disease: string;
  medicine?: string;
  status: DiseaseStatus;
  startDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVaccinationRecord extends Document {
  animalId: mongoose.Types.ObjectId;
  vaccineName: string;
  dose: string;
  scheduledAt: Date;
  status: VaccinationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicineStock extends Document {
  name: string;
  type?: string;
  dose?: string;
  stock: number;
  forDisease?: string;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseRecordSchema = new Schema<IDiseaseRecord>(
  {
    animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
    disease: { type: String, required: true, trim: true },
    medicine: { type: String, trim: true, default: '-' },
    status: {
      type: String,
      enum: ['Active', 'Critical', 'Chronic', 'Recovered'],
      default: 'Active',
      index: true,
    },
    startDate: { type: Date, required: true, index: true },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const VaccinationRecordSchema = new Schema<IVaccinationRecord>(
  {
    animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
    vaccineName: { type: String, required: true, trim: true },
    dose: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Missed'],
      default: 'Scheduled',
      index: true,
    },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const MedicineStockSchema = new Schema<IMedicineStock>(
  {
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, trim: true, default: '' },
    dose: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    forDisease: { type: String, trim: true, default: '' },
    lowStockThreshold: { type: Number, min: 0, default: 50 },
  },
  { timestamps: true }
);

export const DiseaseRecord = mongoose.model<IDiseaseRecord>('DiseaseRecord', DiseaseRecordSchema);
export const VaccinationRecord = mongoose.model<IVaccinationRecord>('VaccinationRecord', VaccinationRecordSchema);
export const MedicineStock = mongoose.model<IMedicineStock>('MedicineStock', MedicineStockSchema);
