import mongoose, { Schema } from 'mongoose';
import { ITask } from './task.types';

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['once', 'daily'], default: 'once' },
    isCompleted: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, sparse: true }, // Optional, only for 'once' type
    visibility: { type: String, required: true, enum: ['public', 'private'], default: 'private' },
    lastCompletedAt: { type: Date, sparse: true },
    completionHistory: [
      {
        date: { type: Date, required: true },
        completedAt: { type: Date, required: true },
      }
    ],
  },
  { timestamps: true }
);

// Index for efficient querying
TaskSchema.index({ assignedTo: 1, type: 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ visibility: 1 });
TaskSchema.index({ createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
