import mongoose, { Schema, Types } from 'mongoose';

// ─── Sub-interfaces ───────────────────────────────────────────────────────────

interface ISemenInfo {
  bullName?: string;
  breed?: string;
  source?: string;
  strawCode?: string;
}

// ─── Main Interface ───────────────────────────────────────────────────────────

interface IAnimal {
  // Identity
  tag?: string;
  name: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: Date;
  weight: number;
  group: 'Cow' | 'Bull' | 'Heifer' | 'Calf';

  // Lactation & Reproduction (females only)
  parity?: number;
  lactationStage?: 'Early' | 'Mid' | 'Late' | 'Dry';
  reproductiveStatus?: 'Pregnant' | 'Inseminated' | 'Open';
  calvingDate?: Date;

  // Lineage
  dam?: Types.ObjectId;          // mother — always a Cattle doc
  sireType?: 'bull' | 'semen' | 'unknown';
  sire?: Types.ObjectId;         // father — only if sireType === 'bull'
  semenInfo?: ISemenInfo;        // only if sireType === 'semen'

  // Meta
  healthStatus?: string;
  origin?: 'Born on Farm' | 'Purchased';
  purchaseRate?: number;
  purchaseDate?: Date;
  notes?: string;
  isActive?: boolean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SemenInfoSchema = new Schema<ISemenInfo>(
  {
    bullName: { type: String, trim: true },
    breed: { type: String, trim: true },
    source: { type: String, trim: true },
    strawCode: { type: String, trim: true },
  },
  { _id: false }
);

const AnimalSchema = new Schema<IAnimal>(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    tag: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    breed: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dob: { type: Date, required: true },
    weight: { type: Number, required: true, min: 0 },
    group: { type: String, required: true, enum: ['Cow', 'Bull', 'Heifer', 'Calf'], default: 'Heifer' },

    // ── Lactation & Reproduction ──────────────────────────────────────────────
    parity: { type: Number, min: 0, default: 0 },
    lactationStage: { type: String, enum: ['Early', 'Mid', 'Late', 'Dry'] },
    reproductiveStatus: { type: String, enum: ['Pregnant', 'Inseminated', 'Open'], default: 'Open' },
    calvingDate: { type: Date },

    // ── Lineage ───────────────────────────────────────────────────────────────
    dam: { type: Schema.Types.ObjectId, ref: 'Animal', default: null },
    sireType: { type: String, enum: ['bull', 'semen', 'unknown'], default: null },
    sire: { type: Schema.Types.ObjectId, ref: 'Animal', default: null },
    semenInfo: { type: SemenInfoSchema, default: null },

    // ── Meta ──────────────────────────────────────────────────────────────────
    healthStatus: { type: String, default: 'Healthy' },
    origin: { type: String, enum: ['Born on Farm', 'Purchased'], default: 'Born on Farm' },
    purchaseRate: { type: Number },
    purchaseDate: { type: Date },
    notes: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

AnimalSchema.index({ group: 1, isActive: 1 });
AnimalSchema.index({ dam: 1 });
AnimalSchema.index({ sire: 1 });

// ─── Validation ───────────────────────────────────────────────────────────────

// sire ref only makes sense when sireType is 'bull'
AnimalSchema.pre('save', function (next) {
  if (this.sireType === 'bull' && !this.sire) {
    return next(new Error('sire reference is required when sireType is "bull"'));
  }
  if (this.sireType === 'semen' && !this.semenInfo?.bullName) {
    return next(new Error('semenInfo.bullName is required when sireType is "semen"'));
  }
  if (this.sireType !== 'semen') {
    this.semenInfo = undefined;
  }
  if (this.sireType !== 'bull') {
    this.sire = undefined;
  }

  // lactation fields are only relevant for females
  if (this.gender === 'Male') {
    this.parity = undefined;
    this.lactationStage = undefined;
    this.reproductiveStatus = undefined;
    this.calvingDate = undefined;
  }

  next();
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Animal = mongoose.model<IAnimal>('Animal', AnimalSchema);
