import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  userId: string | null;
  ip: string;
  workflowId?: string;
  provider: string;
  aiModel?: string;  // Renamed from 'model' to avoid conflict with Mongoose Document
  purpose?: string;
  inputHash: string;
  inputSize: number;
  decision: 'allow' | 'deny';
  reason?: string;
  safetyFlags?: string[];
  outputSize?: number;
  tokenCount?: number;
  requestId: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  timestamp: { type: Date, required: true, index: true },
  userId: { type: String, default: null, index: true },
  ip: { type: String, required: true },
  workflowId: { type: String, index: true },
  provider: { type: String, required: true },
  aiModel: { type: String },
  purpose: { type: String },
  inputHash: { type: String, required: true },
  inputSize: { type: Number, required: true },
  decision: { type: String, enum: ['allow', 'deny'], required: true, index: true },
  reason: { type: String },
  safetyFlags: [{ type: String }],
  outputSize: { type: Number },
  tokenCount: { type: Number },
  requestId: { type: String, required: true, unique: true, index: true }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'audit_logs'
});

// Index for querying recent logs
auditLogSchema.index({ timestamp: -1 });

// Index for user activity
auditLogSchema.index({ userId: 1, timestamp: -1 });

// TTL index for auto-deletion after retention period (90 days default)
const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90');
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
