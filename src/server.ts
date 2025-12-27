import http from 'http';
import express from 'express';
import cors from 'cors';

import workflowRoutes from './routes/workflowRoutes.js';

export function createHttpServer(allTools: any[]) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get(['/health', '/'], (req, res) => {
    res.json({ status: 'healthy', service: 'MCP Project Manager', tools: allTools.length, timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', tools: allTools.length });
  });

  app.get('/api/tools', (req, res) => {
    res.json({ tools: allTools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
  });

  app.post('/api/tools/execute', async (req, res) => {
    try {
      const { tool: toolName, args } = req.body || {};
      const tool = allTools.find((t: any) => t.name === toolName);
      if (!tool) return res.status(404).json({ error: 'Tool not found' });
      const result = await tool.handler(args || {});
      res.json({ result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Execution error' });
    }
  });

  app.use('/api/workflows', workflowRoutes);

  const server = http.createServer(app);
  return server;
}
