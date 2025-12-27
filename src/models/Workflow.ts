import mongoose, { Schema, Document, Model } from 'mongoose';

// Make the persisted workflow flexible to support various UI shapes
export interface WorkflowDoc extends Document {
  name: string;
  description?: string;
  steps: any[]; // store step objects as-is for compatibility
  tags?: string[];
  phases?: string[];
  formData?: Record<string, unknown>;
  status?: string;
  lastRunAt?: Date;
  questions?: Array<{
    id: string;
    text: string;
    type?: string;
    required?: boolean;
    answer?: unknown;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<WorkflowDoc>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    // Allow arbitrary array of step objects (cast to satisfy TS)
    steps: ({ type: [Schema.Types.Mixed] as any, default: [] } as any),
    tags: { type: [String], default: [] },
    phases: { type: [String], default: [] },
    formData: { type: Schema.Types.Mixed },
    status: { type: String, default: 'draft' },
    lastRunAt: { type: Date },
    questions: ({ type: [Schema.Types.Mixed] as any, default: [] } as any)
  },
  { timestamps: true }
);

export const Workflow: Model<WorkflowDoc> =
  mongoose.models.Workflow || mongoose.model<WorkflowDoc>('Workflow', WorkflowSchema);
