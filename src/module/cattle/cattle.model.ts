import mongoose, { Schema } from 'mongoose';

interface IAnimal {
  tag?: string;
  rfid: string;
  name: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: Date;
  weight: number;
  parity: number;
  lactationStage: 'Early' | 'Mid' | 'Late' | 'Dry';
  reproductiveStatus: 'Pregnant' | 'Inseminated' | 'Open';
  calvingDate?: Date;
  group: 'Cow' | 'Bull' | 'Heifer' | 'Calf';
  healthStatus?: string;
  origin?: string;
  notes?: string;
  isActive?: boolean;
}

const AnimalSchema = new Schema<IAnimal>(
  {
    rfid: { type: String, required: true, unique: true, trim: true },
    tag: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    breed: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dob: { type: Date, required: true },
    weight: { type: Number, min: 0, required: true },
    parity: { type: Number, min: 0, default: 0 },
    lactationStage: { type: String, enum: ['Early', 'Mid', 'Late', 'Dry'], default: 'Early' },
    reproductiveStatus: { type: String, enum: ['Pregnant', 'Inseminated', 'Open'], default: 'Open' },
    calvingDate: { type: Date },
    group: { type: String, enum: ['Cow', 'Bull', 'Heifer', 'Calf'], default: 'Heifer' },
    healthStatus: { type: String, default: 'Healthy' },
    origin: { type: String, default: 'Born on Farm' },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Animal = mongoose.model<IAnimal>('Animal', AnimalSchema);