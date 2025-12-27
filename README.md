# MCP Project Manager (Standalone)

A standalone Model Context Protocol (MCP) server with workflow capabilities:
- Gemini: requirements and design
- ChatGPT: testing and scenarios
- Claude: code generation and review

## Quick Start

```bash
# macOS
cd /Users/shivankbansal/Documents/mcp-project-manager
npm install
cp .env.example .env
# edit .env with API keys + MONGODB_URI (optional)
npm run build
node dist/index.js
```

## Scripts
- `npm run dev`: Start MCP server in dev (tsx)
- `npm run build`: Compile TypeScript
- `npm start`: Start via tsx (dev runner)
- `npm run health`: Validate tool loading

## Deploy
- Backend: Render (use `render.yaml`)
- Frontend: Vercel (frontend folder)

## Structure
```
.
├── src/
│   ├── index.ts            # MCP stdio + Express HTTP
│   ├── server.ts           # Express app and routes
│   ├── tools/
│   ├── models/
│   ├── services/
│   └── routes/
├── healthcheck.js
├── render.yaml
├── package.json
├── tsconfig.json
└── README.md
```
