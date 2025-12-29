import { Router } from 'express';
import type { Request, Response } from 'express';
import { Workflow } from '../models/Workflow.js';
import { generateContent as generateAIContent, generateContentStream, getAvailableProviders, AIProvider } from '../services/aiService.js';
import {
  enforceProviderAllowlist,
  requirePurpose,
  checkInputSafety,
  aiGenerationRateLimit,
  checkDailyQuota,
  requireAUPAcceptance,
  markAIOutput
} from '../middleware/responsibleAI.js';
import {
  validate,
  validateMongoId,
  createWorkflowSchema,
  updateWorkflowSchema,
  executeWorkflowSchema,
  streamGenerationSchema,
  quickstartSchema,
  answerSubmissionSchema
} from '../middleware/validation.js';
import { strictRateLimit, requireAdmin } from '../middleware/security.js';
import { requireAuth, checkUserQuota, requireAUPAcceptanceAuth, requireAdminRole } from '../middleware/auth.js';

const router = Router();

// Use MongoDB via Mongoose model; fallback in-memory if no DB connection
const inMemory: any[] = [];

// Get available AI providers - MUST be before /:id route
router.get('/ai/providers', (req: Request, res: Response) => {
  console.log('[AI] Checking providers:', getAvailableProviders());
  res.json(getAvailableProviders());
});

router.get('/', async (req: Request, res: Response) => {
  try {
    if (Workflow.db?.readyState === 1) {
      const workflows = await Workflow.find().sort({ createdAt: -1 }).lean();
      return res.json(workflows);
    }
    return res.json(inMemory);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to list workflows' });
  }
});

router.post('/',
  requireAuth,
  validate(createWorkflowSchema),
  async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    // Sanitize payload
    const payload: any = {
      name: body.name,
      description: body.description,
      steps: Array.isArray(body.steps) ? body.steps : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      phases: Array.isArray(body.phases) ? body.phases : [],
      formData: body.formData || undefined,
      status: body.status || 'draft'
    };

    if (Workflow.db?.readyState === 1) {
      const created = await Workflow.create(payload);
      return res.status(201).json(created);
    }
    const wf = { id: `${Date.now()}`, ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    inMemory.push(wf);
    return res.status(201).json(wf);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to create workflow' });
  }
});

router.get('/:id',
  validateMongoId(),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (Workflow.db?.readyState === 1) {
      const wf = await Workflow.findById(id).lean();
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });
      return res.json(wf);
    }
    const wf = inMemory.find(w => w.id === id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    return res.json(wf);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch workflow' });
  }
});

router.put('/:id',
  requireAuth,
  validateMongoId(),
  validate(updateWorkflowSchema),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (Workflow.db?.readyState === 1) {
      const updated = await Workflow.findByIdAndUpdate(id, body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Workflow not found' });
      return res.json(updated);
    }
    const idx = inMemory.findIndex(w => w.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
    inMemory[idx] = { ...inMemory[idx], ...body, updatedAt: new Date().toISOString() };
    return res.json(inMemory[idx]);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to update workflow' });
  }
});

router.delete('/:id',
  requireAuth,
  validateMongoId(),
  requireAdminRole,
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (Workflow.db?.readyState === 1) {
      const deleted = await Workflow.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ error: 'Workflow not found' });
      return res.json({ deleted: deleted._id });
    }
    const idx = inMemory.findIndex(w => w.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
    const [removed] = inMemory.splice(idx, 1);
    return res.json({ deleted: removed?.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to delete workflow' });
  }
});

router.post('/:id/execute',
  requireAuth,
  validateMongoId(),
  requireAUPAcceptanceAuth,
  checkUserQuota,
  aiGenerationRateLimit,
  enforceProviderAllowlist,
  requirePurpose,
  checkInputSafety,
  strictRateLimit,
  validate(executeWorkflowSchema),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stepIndex, provider = 'auto' } = req.body || {};

    // Check if AI providers are available
    const providers = getAvailableProviders();
    const hasAI = providers.openai || providers.gemini;

    if (Workflow.db?.readyState === 1) {
      const wf = await Workflow.findById(id);
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });
      
      const steps = (wf as any).steps || [];
      const projectDescription = (wf as any).formData?.initialPrompt || (wf as any).description || 'Project';
      const additionalContext = (wf as any).formData ? JSON.stringify((wf as any).formData) : undefined;
      
      if (typeof stepIndex === 'number' && steps[stepIndex]) {
        const step = steps[stepIndex];
        const phase = step.phase || 'brd';
        
        let result: any;
        
        if (hasAI) {
          // Use real AI generation
          try {
            const aiResult = await generateAIContent(phase, projectDescription, additionalContext, provider as AIProvider);
            result = {
              content: aiResult.content,
              generatedAt: new Date().toISOString(),
              provider: aiResult.provider,
              model: aiResult.model,
              aiGenerated: true
            };
          } catch (aiError: any) {
            // Fallback to template if AI fails
            result = {
              content: getFallbackContent(phase, projectDescription),
              generatedAt: new Date().toISOString(),
              aiGenerated: false,
              error: aiError.message
            };
          }
        } else {
          // No AI available, use fallback
          result = {
            content: getFallbackContent(phase, projectDescription),
            generatedAt: new Date().toISOString(),
            aiGenerated: false,
            notice: 'AI not configured. Set OPENAI_API_KEY or GOOGLE_API_KEY for AI-generated content.'
          };
        }
        
        steps[stepIndex] = { ...step, status: 'completed', result };
        wf.set('steps', steps);
      }
      
      wf.set('lastRunAt', new Date());
      await wf.save();
      return res.json({ status: 'completed', workflowId: wf.id, result: steps[stepIndex]?.result, providers });
    }
    
    // In-memory fallback
    const wf = inMemory.find((w: any) => w.id === id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    
    const projectDescription = wf.formData?.initialPrompt || wf.description || 'Project';
    const additionalContext = wf.formData ? JSON.stringify(wf.formData) : undefined;
    
    if (typeof stepIndex === 'number' && wf.steps?.[stepIndex]) {
      const step = wf.steps[stepIndex];
      const phase = step.phase || 'brd';
      
      let result: any;
      
      if (hasAI) {
        try {
          const aiResult = await generateAIContent(phase, projectDescription, additionalContext, provider as AIProvider);
          result = {
            content: aiResult.content,
            generatedAt: new Date().toISOString(),
            provider: aiResult.provider,
            model: aiResult.model,
            aiGenerated: true
          };
        } catch (aiError: any) {
          result = {
            content: getFallbackContent(phase, projectDescription),
            generatedAt: new Date().toISOString(),
            aiGenerated: false,
            error: aiError.message
          };
        }
      } else {
        result = {
          content: getFallbackContent(phase, projectDescription),
          generatedAt: new Date().toISOString(),
          aiGenerated: false,
          notice: 'AI not configured. Set OPENAI_API_KEY or GOOGLE_API_KEY for AI-generated content.'
        };
      }
      
      wf.steps[stepIndex] = { ...step, status: 'completed', result };
    }
    
    wf.lastRunAt = new Date().toISOString();
    return res.json({ status: 'completed', workflowId: wf.id, result: wf.steps?.[stepIndex]?.result, providers });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to execute workflow' });
  }
});

// Fallback content when AI is not available
function getFallbackContent(phase: string, projectDescription: string): string {
  const templates: Record<string, string> = {
    brd: `# Business Requirements Document

## Project Overview
${projectDescription}

## Note
This is a placeholder template. Configure OPENAI_API_KEY or GOOGLE_API_KEY environment variables to generate AI-powered content.

## Sections to Include
1. Executive Summary
2. Business Objectives
3. Scope (In/Out of Scope)
4. Stakeholders
5. Functional Requirements
6. Non-Functional Requirements
7. User Stories
8. Success Metrics
9. Risks & Mitigations
10. Timeline`,

    design: `# Design Specification

## Project
${projectDescription}

## Note
This is a placeholder template. Configure OPENAI_API_KEY or GOOGLE_API_KEY environment variables to generate AI-powered content.

## Sections to Include
1. Design Philosophy
2. Design System (Colors, Typography, Spacing)
3. Component Library
4. Layout System
5. Key Screens
6. Wireframes
7. Interaction Patterns
8. Accessibility`,

    journey: `# User Journey Documentation

## Project
${projectDescription}

## Note
This is a placeholder template. Configure OPENAI_API_KEY or GOOGLE_API_KEY environment variables to generate AI-powered content.

## Sections to Include
1. User Personas
2. Journey Maps
3. User Flows
4. Edge Cases
5. Jobs to Be Done
6. Friction Points
7. Success Metrics`,

    testing: `# Test Plan & Test Cases

## Project
${projectDescription}

## Note
This is a placeholder template. Configure OPENAI_API_KEY or GOOGLE_API_KEY environment variables to generate AI-powered content.

## Sections to Include
1. Test Strategy
2. Test Cases (Auth, Core, Edge)
3. API Tests
4. Performance Tests
5. Security Tests
6. Accessibility Tests
7. Browser/Device Matrix`
  };
  
  return templates[phase] || `# ${phase}\n\n${projectDescription}`;
}

// Real-time streaming workflow generation
router.post('/generate/stream',
  requireAuth,
  requireAUPAcceptanceAuth,
  checkUserQuota,
  aiGenerationRateLimit,
  enforceProviderAllowlist,
  requirePurpose,
  checkInputSafety,
  validate(streamGenerationSchema),
  async (req: Request, res: Response) => {
  try {
    const { prompt, provider = 'auto', phases: requestedPhases } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Determine phases to generate
    const allPhases = ['brd', 'design', 'journey', 'testing'];
    const phases = Array.isArray(requestedPhases) && requestedPhases.length > 0
      ? requestedPhases
      : allPhases;

    const phaseNames: Record<string, string> = {
      brd: 'Business Requirements',
      design: 'Design & Wireframes',
      journey: 'User Journeys',
      testing: 'Test Cases'
    };

    sendEvent('workflow_start', {
      phases,
      totalPhases: phases.length,
      message: 'Starting workflow generation...'
    });

    const workflowSteps: any[] = [];
    let workflowId: string | null = null;

    try {
      // Generate each phase sequentially with streaming
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const phaseName = phaseNames[phase] || phase;

        sendEvent('phase_start', {
          phase,
          phaseName,
          phaseIndex: i,
          totalPhases: phases.length,
          message: `Generating ${phaseName}...`
        });

        let fullContent = '';
        let wordCount = 0;
        const startTime = Date.now();

        try {
          // Stream content generation
          for await (const chunk of generateContentStream(phase, prompt, undefined, provider as AIProvider)) {
            if (!chunk.done) {
              fullContent += chunk.chunk;
              wordCount = fullContent.split(/\s+/).length;

              sendEvent('content_chunk', {
                phase,
                chunk: chunk.chunk,
                wordCount,
                metadata: chunk.metadata
              });
            }
          }

          const duration = Math.round((Date.now() - startTime) / 1000);

          sendEvent('phase_complete', {
            phase,
            phaseName,
            phaseIndex: i,
            wordCount,
            duration,
            message: `${phaseName} complete!`
          });

          workflowSteps.push({
            id: `step-${phase}`,
            phase,
            title: phaseName,
            status: 'completed',
            order: i,
            result: {
              content: fullContent,
              generatedAt: new Date().toISOString(),
              aiGenerated: true,
              wordCount,
              duration
            }
          });

        } catch (phaseError: any) {
          sendEvent('phase_error', {
            phase,
            phaseName,
            error: phaseError.message || 'Phase generation failed'
          });

          workflowSteps.push({
            id: `step-${phase}`,
            phase,
            title: phaseName,
            status: 'error',
            order: i,
            result: {
              error: phaseError.message,
              generatedAt: new Date().toISOString(),
              aiGenerated: false
            }
          });
        }
      }

      // Save the completed workflow
      const workflowPayload: any = {
        name: prompt.slice(0, 80),
        description: prompt,
        phases,
        steps: workflowSteps,
        status: 'completed',
        formData: { initialPrompt: prompt }
      };

      if (Workflow.db?.readyState === 1) {
        const created = await Workflow.create(workflowPayload);
        workflowId = created._id?.toString() || created.id;
      } else {
        const wf = {
          id: `${Date.now()}`,
          ...workflowPayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        inMemory.push(wf);
        workflowId = wf.id;
      }

      sendEvent('workflow_complete', {
        workflowId,
        totalPhases: phases.length,
        message: 'All phases complete!'
      });

    } catch (error: any) {
      sendEvent('error', {
        message: error.message || 'Workflow generation failed'
      });
    }

    res.end();
  } catch (e: any) {
    console.error('[Streaming] Error:', e);
    res.status(500).json({ error: e?.message || 'Failed to start streaming workflow' });
  }
});

// Quickstart: create a workflow from a single prompt and pre-generate steps
router.post('/quickstart',
  requireAuth,
  requireAUPAcceptanceAuth,
  checkUserQuota,
  aiGenerationRateLimit,
  enforceProviderAllowlist,
  requirePurpose,
  checkInputSafety,
  strictRateLimit,
  validate(quickstartSchema),
  async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // Basic heuristics to create phases and steps
    const phases = ['brd', 'design', 'journey', 'testing'];
    const steps = phases.map((phase, idx) => ({
      id: `step-${phase}-${idx + 1}`,
      phase,
      title: phase === 'brd'
        ? 'Business Requirements'
        : phase === 'design'
        ? 'Design & Wireframes'
        : phase === 'journey'
        ? 'User Journeys'
        : 'Test Cases',
      status: 'completed',
      order: idx,
      result: {
        summary: `Auto-generated ${phase} from prompt.`,
        content: `Source prompt: ${prompt}`
      }
    }));

    // Generate follow-up question if the prompt is too short
    const questions = prompt.trim().length < 60
      ? [
          {
            id: 'q-target-audience',
            text: 'Who is the target audience for this project?',
            type: 'text',
            required: false
          }
        ]
      : [];

    const payload: any = {
      name: prompt.slice(0, 80),
      description: prompt,
      phases,
      steps,
      status: 'in-progress',
      formData: { initialPrompt: prompt },
      questions
    };

    if (Workflow.db?.readyState === 1) {
      const created = await Workflow.create(payload);
      return res.status(201).json(created);
    }
    const wf = { id: `${Date.now()}`, ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    inMemory.push(wf);
    return res.status(201).json(wf);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to quickstart workflow' });
  }
});

// Answer follow-up questions and merge into formData
router.post('/:id/answer',
  validateMongoId(),
  validate(answerSubmissionSchema),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body || {};
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers must be an object' });
    }

    if (Workflow.db?.readyState === 1) {
      const wf = await Workflow.findById(id);
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });
      const q = Array.isArray((wf as any).questions) ? (wf as any).questions : [];
      const updatedQ = q.map((item: any) => {
        const answer = answers[item.id];
        return answer !== undefined ? { ...item, answer } : item;
      });
      const mergedForm = { ...(wf as any).formData, ...answers };
      wf.set('questions', updatedQ);
      wf.set('formData', mergedForm);
      await wf.save();
      return res.json(wf.toObject());
    }
    const idx = inMemory.findIndex((w: any) => w.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
    const wf = inMemory[idx];
    const q = Array.isArray(wf.questions) ? wf.questions : [];
    const updatedQ = q.map((item: any) => {
      const answer = answers[item.id];
      return answer !== undefined ? { ...item, answer } : item;
    });
    const mergedForm = { ...(wf.formData || {}), ...answers };
    const updated = { ...wf, questions: updatedQ, formData: mergedForm, updatedAt: new Date().toISOString() };
    inMemory[idx] = updated;
    return res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to submit answers' });
  }
});

router.get('/templates/list', (req: Request, res: Response) => {
  const templates = [
    { id: 'tmpl-project-lifecycle', name: 'Full Project Lifecycle' },
    { id: 'tmpl-req-to-design', name: 'Requirements to Design' },
    { id: 'tmpl-test-coverage', name: 'Test Coverage Analysis' },
    { id: 'tmpl-code-gen', name: 'Code Generation Pipeline' },
    { id: 'tmpl-feature-impl', name: 'Feature Implementation' },
  ];
  res.json({ templates });
});

export default router;
