# MCP Project Manager

A production-grade full-stack application for managing project workflows using MCP (Model Context Protocol) servers. Create comprehensive project plans spanning Business Requirements, Design, User Journeys, and Test Cases with AI-powered assistance.

## ✨ Features

### 🎯 Multi-Phase Workflow Management
- **Business Requirements (BRD)**: Define scope, features, timeline, and budget
- **Design & Wireframes**: Create UI/UX specifications with accessibility requirements
- **User Journey**: Map user personas, flows, pain points, and success metrics
- **Test Cases**: Define comprehensive testing strategies and coverage

### 🤖 AI-Powered Tools
- **Groq**: Ultra-fast inference with Llama 3.3 70B (FREE, recommended)
- **Ollama**: Self-hosted local models for complete privacy
- **OpenAI**: GPT-4o for highest quality documentation
- **Gemini**: Google's AI for requirements and design assistance

### 📊 Dashboard & Workflows
- Create workflows from predefined templates
- Multi-step workflow builder with progress tracking
- Real-time workflow execution and status management
- Beautiful dark-mode UI with responsive design

### 🚀 Deployment Ready
- Backend: Deployed on Render (https://mcp-project-manager.onrender.com)
- Frontend: Ready for Vercel deployment
- MongoDB integration (optional, uses in-memory fallback)

## 🏗️ Architecture

### Monorepo Structure
```
├── Backend (Node.js + TypeScript)
│   ├── MCP stdio + HTTP server
│   ├── Express API routes
│   ├── Mongoose + MongoDB support
│   └── AI tool integrations
│
└── Frontend (React + Vite + Tailwind)
    ├── Multi-page SPA with routing
    ├── Dashboard, Builder, Execution views
    └── Modern UI with dark mode
```

## 🚀 Quick Start

### Backend

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys and MongoDB URI

# Development
npm run dev

# Build & run
npm run build
node dist/index.js

# Health check
curl http://localhost:10000/health
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build
```

## 📝 API Endpoints

### Workflows
- `GET /api/workflows` — List all workflows
- `POST /api/workflows` — Create new workflow
- `GET /api/workflows/:id` — Get workflow details
- `PUT /api/workflows/:id` — Update workflow
- `DELETE /api/workflows/:id` — Delete workflow
- `POST /api/workflows/:id/execute` — Execute workflow step

### Tools
- `GET /api/tools` — List available MCP tools
- `POST /api/tools/execute` — Execute a tool

### System
- `GET /health` — Health check endpoint

## 🌐 Deployment

### Backend (Render)
- ✅ Deployed: https://mcp-project-manager.onrender.com
- Auto-deploys from GitHub on push
- Uses `render.yaml` configuration

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set Root Directory: `frontend`
3. Environment Variable: `VITE_API_URL=<backend-url>`
4. Deploy!

## 🛠️ Technology Stack

### Backend
- Node.js 20 + TypeScript
- Express.js + Mongoose
- MCP SDK (@modelcontextprotocol/sdk)
- OpenAI, Anthropic, Google APIs

### Frontend
- React 18 + Vite
- React Router v6
- Tailwind CSS + PostCSS
- Axios for HTTP

## 📚 Documentation

- [Complete Project Documentation](PROJECT_DOCUMENTATION.md) - Full technical guide
- [API Reference](API_REFERENCE.md) - Complete API documentation with examples
- [AI Providers Setup](AI_PROVIDERS.md) - Guide for Groq, Ollama, OpenAI, Gemini
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Deploy to Vercel/Netlify/Render
- [Frontend Guide](frontend/README.md) - React frontend documentation

## 🔐 Environment Variables

### Backend (.env)
```bash
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...

# AI Providers (configure at least one)
GROQ_API_KEY=gsk-...              # Recommended: Free & fast
OLLAMA_ENABLED=true               # Self-hosted option
OLLAMA_MODEL=llama3.2             # Optional, default: llama3.2
OPENAI_API_KEY=sk-...             # Optional: Highest quality
GOOGLE_API_KEY=AIza...            # Optional: Google Gemini
```

### Frontend (.env.local)
```bash
VITE_API_URL=https://mcp-project-manager.onrender.com
```

## 📊 Project Scope

### Workflow Phases
1. **BRD** - Business Requirements Documentation
2. **Design** - UI/UX Design & Wireframes
3. **Journey** - User Journeys & Workflows
4. **Testing** - Test Cases & QA Strategy

### Templates
- Full Project Lifecycle (all 4 phases)
- Requirements to Design (BRD + Design)
- Test Coverage (Journey + Testing)
- Documentation & Specs (BRD focused)

## 🐛 Troubleshooting

**Backend not starting?**
```bash
# Check dependencies
npm install

# Verify Node version
node --version  # Should be 20+

# Clear build cache
rm -rf dist
npm run build
```

**Frontend API calls failing?**
- Verify backend is running: `curl http://localhost:10000/health`
- Check `VITE_API_URL` environment variable
- Review browser console for CORS errors

**Workflow not saving?**
- Check MongoDB connection (if using)
- Verify API endpoint is correct
- Check request body format

## 📖 Workflow Example

1. **Create Workflow**
   - Go to Dashboard
   - Click "New Workflow"
   - Select template (e.g., "Full Project Lifecycle")

2. **Fill Phases**
   - Phase 1: Business Requirements
   - Phase 2: Design & Wireframes
   - Phase 3: User Journeys
   - Phase 4: Test Cases

3. **Execute Steps**
   - Click "Execute Step" for each phase
   - AI tools generate requirements, design specs, etc.
   - Review and approve results

4. **Track Progress**
   - Monitor workflow status
   - Update completion percentage
   - Export final documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to your fork
5. Open a Pull Request

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Review [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
3. Open a new issue with reproduction steps

## 📄 License

MIT License - See LICENSE file for details

---

**Status**: ✅ Production Ready  
**Backend**: Live on Render  
**Frontend**: Ready for Vercel
