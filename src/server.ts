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
  disableToolExecution,
  requireAdmin
} from './middleware/security.js';
import { validate, toolExecutionSchema } from './middleware/validation.js';
import { addRequestId } from './middleware/requestId.js';
import { getAuditLogsFromDB } from './middleware/responsibleAI.js';

export function createHttpServer(allTools: any[]) {
  const app = express();

  // Request ID - Apply FIRST for request tracing
  app.use(addRequestId);

  // Security middleware
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

  // Admin audit log viewer
  app.get('/api/audit/ai-logs', requireAdmin, async (req, res) => {
    try {
      const { limit, userId, decision, startDate, endDate } = req.query;

      const logs = await getAuditLogsFromDB({
        limit: limit ? parseInt(limit as string) : 100,
        userId: userId as string,
        decision: decision as 'allow' | 'deny',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.json({
        logs,
        total: logs.length,
        requestId: req.id
      });
    } catch (err: any) {
      console.error('[Audit] Error fetching logs:', err);
      res.status(500).json({
        error: 'Audit Log Fetch Error',
        message: err?.message || 'Failed to fetch audit logs',
        requestId: req.id
      });
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.id
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
      requestId: req.id,
      ...(isDev && { stack: err.stack })
    });
  });

  const server = http.createServer(app);
  return server;
}
