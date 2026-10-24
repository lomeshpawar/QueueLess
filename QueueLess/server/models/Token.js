import mongoose from 'mongoose';
import { ALL_SERVICES } from '../utils/constants.js';

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true },
  visitorName: { type: String, required: true, trim: true, maxlength: 80 },
  service: { type: String, required: true, enum: ALL_SERVICES },
  status: { type: String, enum: ['waiting', 'serving', 'served', 'skipped'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  calledAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  queueDate: { type: String, required: true }
}, { timestamps: true });

tokenSchema.index({ queueDate: 1, tokenNumber: 1 }, { unique: true });
tokenSchema.index({ queueDate: 1, service: 1, status: 1, createdAt: 1 });
tokenSchema.index({ queueDate: 1, status: 1, createdAt: 1 });

export default mongoose.model('Token', tokenSchema);

