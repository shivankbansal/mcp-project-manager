#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import { createHttpServer } from './server.js';
import { geminiTools } from './tools/gemini-tools.js';
import { chatgptTools } from './tools/chatgpt-tools.js';
import { claudeTools } from './tools/claude-tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const allTools = [...geminiTools, ...chatgptTools, ...claudeTools];

type Tool = {
  name: string;
  description: string;
  inputSchema: unknown;
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
};

const mergedTools: Tool[] = [...(geminiTools as unknown as Tool[]), ...(chatgptTools as unknown as Tool[]), ...(claudeTools as unknown as Tool[])];

class ProjectManagerServer {
  private server: Server;

  constructor() {
    this.server = new Server({ name: 'mcp-project-manager', version: '2.0.0' });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: mergedTools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = mergedTools.find(t => t.name === name);
      if (!tool) throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      try {
        const result = await tool.handler((args || {}) as Record<string, unknown>);
        return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
      } catch (err: any) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${err?.message || String(err)}`);
      }
    });
  }

  async start() {
    console.error('Starting MCP Project Manager...');
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server connected');

    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try { await mongoose.connect(mongoUri); console.error('MongoDB connected'); } catch (e) { console.error('MongoDB connect failed:', e); }
    } else {
      console.error('MongoDB URI not set; workflows will not persist');
    }

    const port = parseInt(process.env.PORT || '10000');
    createHttpServer(mergedTools).listen(port, '0.0.0.0', () => {
      console.error(`HTTP server on port ${port}`);
    });
  }
}

const server = new ProjectManagerServer();
server.start().catch((e) => { console.error('Failed to start MCP Project Manager:', e); process.exit(1); });
