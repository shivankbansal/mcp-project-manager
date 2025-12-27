import mongoose, { Schema, Document, Model } from 'mongoose';

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  inputs?: Record<string, unknown>;
  dependsOn?: string[];
}

export interface WorkflowDoc extends Document {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema<WorkflowStep>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    tool: { type: String, required: true },
    inputs: { type: Schema.Types.Mixed },
    dependsOn: { type: [String], default: [] }
  },
  { _id: false }
);

const WorkflowSchema = new Schema<WorkflowDoc>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    steps: { type: [WorkflowStepSchema], default: [] },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Workflow: Model<WorkflowDoc> = mongoose.models.Workflow || mongoose.model<WorkflowDoc>('Workflow', WorkflowSchema);
