import mongoose, { Schema } from 'mongoose';
import { IAnimal } from './cattle.types';

const AnimalSchema = new Schema<IAnimal>(
  {
    tag: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, trim: true },
    breed: { type: String, required: true, trim: true },
    gender: {
      type: String,
      required: true,
      enum: ['cow', 'bull', 'heifer', 'calf'],
    },
    dateOfBirth: { type: Date },
    weight: { type: Number, min: 0 },
    parity: { type: Number, min: 0, default: 0 },
    lactationStage: {
      type: String,
      enum: ['early', 'mid', 'late', 'dry'],
    },
    reproductiveStatus: {
      type: String,
      enum: ['pregnant', 'inseminated', 'open'],
    },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Animal = mongoose.model<IAnimal>('Animal', AnimalSchema);
