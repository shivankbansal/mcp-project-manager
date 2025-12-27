import { Router } from 'express';
import type { Request, Response } from 'express';
import { Workflow } from '../models/Workflow.js';

const router = Router();

// Use MongoDB via Mongoose model; fallback in-memory if no DB connection
const inMemory: any[] = [];

router.get('/', async (req: Request, res: Response) => {
  try {
    if (Workflow.db?.readyState === 1) {
      const workflows = await Workflow.find().sort({ createdAt: -1 }).lean();
      return res.json({ workflows });
    }
    return res.json({ workflows: inMemory });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to list workflows' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (Workflow.db?.readyState === 1) {
      const created = await Workflow.create({
        name: body.name,
        description: body.description,
        steps: body.steps || [],
        tags: body.tags || []
      });
      return res.status(201).json({ workflow: created });
    }
    const wf = { id: `${Date.now()}`, ...body, createdAt: new Date().toISOString() };
    inMemory.push(wf);
    return res.status(201).json({ workflow: wf });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to create workflow' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (Workflow.db?.readyState === 1) {
      const wf = await Workflow.findById(id).lean();
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });
      return res.json({ workflow: wf });
    }
    const wf = inMemory.find(w => w.id === id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    return res.json({ workflow: wf });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch workflow' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (Workflow.db?.readyState === 1) {
      const updated = await Workflow.findByIdAndUpdate(id, body, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Workflow not found' });
      return res.json({ workflow: updated });
    }
    const idx = inMemory.findIndex(w => w.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
    inMemory[idx] = { ...inMemory[idx], ...body, updatedAt: new Date().toISOString() };
    return res.json({ workflow: inMemory[idx] });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to update workflow' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
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

router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (Workflow.db?.readyState === 1) {
      const wf = await Workflow.findById(id);
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });
      wf.set('lastRunAt', new Date());
      await wf.save();
      return res.json({ status: 'queued', workflowId: wf.id });
    }
    const wf = inMemory.find((w: any) => w.id === id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    wf.lastRunAt = new Date().toISOString();
    return res.json({ status: 'queued', workflowId: wf.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to execute workflow' });
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
