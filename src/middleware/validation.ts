import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Input Validation Schemas using Zod
 * Prevents mass-assignment and enforces data integrity
 */

// Workflow creation schema
export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  phases: z.array(z.enum(['brd', 'design', 'journey', 'testing'])).optional(),
  steps: z.array(z.object({
    id: z.string(),
    phase: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    order: z.number().optional(),
    result: z.any().optional()
  })).optional(),
  formData: z.record(z.string(), z.any()).optional()
});

// Workflow update schema (stricter - only allow specific fields)
export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  steps: z.array(z.object({
    id: z.string(),
    phase: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'error']).optional(),
    order: z.number().optional(),
    result: z.any().optional()
  })).optional(),
  formData: z.record(z.string(), z.any()).optional()
});

// Workflow execution schema
export const executeWorkflowSchema = z.object({
  stepIndex: z.number().optional(),
  phase: z.enum(['brd', 'design', 'journey', 'testing']).optional(),
  provider: z.enum(['auto', 'openai', 'gemini', 'groq', 'ollama']).optional(),
  purpose: z.enum([
    'product_documentation',
    'business_requirements',
    'design_specifications',
    'user_journey_mapping',
    'test_case_generation',
    'technical_documentation',
    'ui_ux_design',
    'api_documentation'
  ]).optional()
});

// Streaming generation schema
export const streamGenerationSchema = z.object({
  prompt: z.string().min(10).max(10000),
  provider: z.enum(['auto', 'openai', 'gemini', 'groq', 'ollama']).optional(),
  phases: z.array(z.enum(['brd', 'design', 'journey', 'testing'])).optional(),
  purpose: z.enum([
    'product_documentation',
    'business_requirements',
    'design_specifications',
    'user_journey_mapping',
    'test_case_generation',
    'technical_documentation',
    'ui_ux_design',
    'api_documentation'
  ]).optional()
});

// Quickstart schema
export const quickstartSchema = z.object({
  prompt: z.string().min(10).max(10000),
  purpose: z.enum([
    'product_documentation',
    'business_requirements',
    'design_specifications',
    'user_journey_mapping',
    'test_case_generation',
    'technical_documentation',
    'ui_ux_design',
    'api_documentation'
  ]).optional()
});

// Tool execution schema
export const toolExecutionSchema = z.object({
  tool: z.string().min(1).max(100),
  args: z.record(z.string(), z.any()).optional()
});

// Answer submission schema
export const answerSubmissionSchema = z.object({
  answers: z.record(z.string(), z.string())
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      // Replace request body with validated data (removes extra fields)
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Path parameter validation
export const validateMongoId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    // MongoDB ObjectId pattern or numeric ID
    const mongoIdPattern = /^[a-f\d]{24}$/i;
    const numericPattern = /^\d+$/;

    if (!mongoIdPattern.test(id) && !numericPattern.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: `Parameter '${paramName}' must be a valid MongoDB ObjectId or numeric ID`
      });
    }

    next();
  };
};
