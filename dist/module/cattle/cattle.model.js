"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Animal = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AnimalSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.Animal = mongoose_1.default.model('Animal', AnimalSchema);
