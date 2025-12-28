import http from 'http';
import express from 'express';
import cors from 'cors';

import workflowRoutes from './routes/workflowRoutes.js';
import {
  securityHeaders,
  generalRateLimit,
  getCorsOptions,
  validateRequest,
  sanitizeInput,
  disableToolExecution
} from './middleware/security.js';
import { validate, toolExecutionSchema } from './middleware/validation.js';

export function createHttpServer(allTools: any[]) {
  const app = express();

  // Security middleware - Apply FIRST
  app.use(securityHeaders);

  // CORS with whitelist
  app.use(cors(getCorsOptions()));

  // Body parsing with size limit
  app.use(express.json({ limit: '1mb' }));

  // Request validation and sanitization
  app.use(validateRequest);
  app.use(sanitizeInput);

  // General rate limiting for all API routes
  app.use('/api', generalRateLimit);

  // Health checks (no rate limit, no auth)
  app.get(['/health', '/'], (req, res) => {
    res.json({
      status: 'healthy',
      service: 'MCP Project Manager',
      tools: allTools.length,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      tools: allTools.length
    });
  });

  // Tool listing (read-only, safe)
  app.get('/api/tools', (req, res) => {
    res.json({
      tools: allTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    });
  });

  // Tool execution - DISABLED in production, requires validation
  app.post('/api/tools/execute',
    disableToolExecution,
    validate(toolExecutionSchema),
    async (req, res) => {
      try {
        const { tool: toolName, args } = req.body;
        const tool = allTools.find((t: any) => t.name === toolName);

        if (!tool) {
          return res.status(404).json({
            error: 'Tool not found',
            message: `No tool named '${toolName}' is available`
          });
        }

        console.log(`[Tool] Executing: ${toolName}`);
        const result = await tool.handler(args || {});

        res.json({ result });
      } catch (err: any) {
        console.error(`[Tool] Error executing ${req.body.tool}:`, err);
        res.status(500).json({
          error: 'Execution error',
          message: err?.message || 'Tool execution failed'
        });
      }
    }
  );

  // Workflow routes with security
  app.use('/api/workflows', workflowRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]:', err);

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(err.status || 500).json({
      error: err.name || 'Internal Server Error',
      message: isDev ? err.message : 'An error occurred',
      ...(isDev && { stack: err.stack })
    });
  });

  const server = http.createServer(app);
  return server;
}
