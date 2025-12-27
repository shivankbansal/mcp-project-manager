# MCP Project Manager - Complete Documentation

## 📋 Overview

MCP Project Manager is a full-stack application for managing project workflows using MCP (Model Context Protocol) servers. It provides an intuitive interface for creating, tracking, and executing workflows that span from Business Requirements through Design, User Journeys, and comprehensive Testing.

**Live Backend**: https://mcp-project-manager.onrender.com (Render)  
**Frontend Ready**: Deploy to Vercel (configure `VITE_API_URL`)

---

## 🎯 Project Scope

### Supported Workflow Phases

1. **📋 Business Requirements (BRD)**
   - Project name, description, scope
   - Target audience definition
   - Feature list and timeline
   - Budget estimation

2. **🎨 Design & Wireframes**
   - Visual design style (Modern, Minimalist, Bold, etc.)
   - Color scheme selection
   - Page/screen definitions
   - Wireframe specifications
   - Accessibility requirements (WCAG compliance)

3. **🚶 User Journey & Workflows**
   - User persona definitions
   - User flow mapping
   - Pain point identification
   - Success metrics

4. **✅ Test Cases & QA**
   - Test types (Unit, Integration, E2E, Performance)
   - Critical user path testing
   - Edge case identification
   - Performance targets
   - Browser/device support matrix

### Workflow Templates

Users can start workflows with predefined templates:
- **Full Project Lifecycle** — All 4 phases
- **Requirements to Design** — BRD + Design phases
- **Test Coverage** — User Journey + Test Cases
- **Documentation & Specs** — BRD + Technical focus

---

## 🏗️ Architecture

### Monorepo Structure

```
mcp-project-manager/
├── Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── index.ts                # MCP stdio + HTTP server entry
│   │   ├── server.ts               # Express HTTP server
│   │   ├── models/Workflow.ts      # Mongoose schema
│   │   ├── routes/workflowRoutes.ts # CRUD endpoints
│   │   └── tools/
│   │       ├── gemini-tools.ts     # AI tool: requirements generation
│   │       ├── chatgpt-tools.ts    # AI tool: code generation
│   │       └── claude-tools.ts     # AI tool: analysis
│   ├── package.json
│   ├── tsconfig.json
│   ├── render.yaml                 # Render deployment config
│   └── healthcheck.js              # Health check endpoint
│
├── Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx                 # Router + Layout
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   ├── WorkflowBuilder.jsx # Multi-step form
│   │   │   └── WorkflowDetails.jsx # Execution interface
│   │   ├── App.css                 # Tailwind + custom styles
│   │   └── main.jsx                # React root
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
│
└── Root
    ├── package.json                # Workspace config
    ├── render.yaml                 # Render deployment
    ├── .gitignore
    └── README.md
```

---

## 🚀 Deployment

### Backend (Render)

**Status**: ✅ Live  
**URL**: https://mcp-project-manager.onrender.com

**Setup Steps**:
1. Connect GitHub repo to Render
2. Select `mcp-project-manager` as root
3. Render auto-detects `render.yaml`
4. Environment variables:
   - `MONGODB_URI` (optional, uses in-memory if not set)
   - `PORT` (default 10000)

**Health Check**: `GET /health` returns 200 + JSON

### Frontend (Vercel)

**Status**: 🔄 Ready to deploy  
**Configuration**:

1. **Build Settings**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
   - Output Directory: `dist`

2. **Environment Variables**
   - `VITE_API_URL`: Backend URL (e.g., `https://mcp-project-manager.onrender.com`)

3. **Deploy Command**
   ```bash
   vercel --prod --cwd frontend
   ```

---

## 🔌 API Endpoints

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List all workflows |
| POST | `/api/workflows` | Create new workflow |
| GET | `/api/workflows/:id` | Get workflow details |
| PUT | `/api/workflows/:id` | Update workflow status |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:id/execute` | Execute workflow step |

### Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tools` | List available MCP tools |
| POST | `/api/tools/execute` | Execute a specific tool |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check + system info |

---

## 💻 Development Setup

### Backend

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server (with auto-restart)
npm run dev

# Test with curl
curl http://localhost:10000/health
```

**Requirements**:
- Node.js 20+
- TypeScript 5+
- Optional: MongoDB (Atlas or local)

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server with HMR
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

**Requirements**:
- Node.js 18+
- npm 9+

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Mongoose + MongoDB (optional)
- **MCP SDK**: @modelcontextprotocol/sdk
- **AI Tools**: OpenAI, Anthropic, Google (configurable)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Router**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Package Manager**: npm

---

## 📊 Data Model

### Workflow Schema

```javascript
{
  _id: ObjectId,
  name: String,              // "E-commerce Platform"
  description: String,       // Project description
  phases: [String],         // ["brd", "design", "journey", "testing"]
  formData: {
    projectName: String,
    projectDescription: String,
    targetAudience: String,
    mainFeatures: String,
    // ... other phase-specific data
  },
  steps: [{
    id: String,             // "step-brd"
    phase: String,          // "brd" | "design" | "journey" | "testing"
    title: String,          // "Business Requirements"
    status: String,         // "pending" | "in-progress" | "completed"
    order: Number,
    result: Object          // AI tool output
  }],
  status: String,           // "draft" | "in-progress" | "completed"
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Workflow Execution Flow

1. **User Creates Workflow**
   - Selects template (Full Lifecycle, Requirements→Design, etc.)
   - Fills multi-step form (BRD → Design → Journey → Testing)
   - Submits to backend via POST `/api/workflows`

2. **Workflow Stored**
   - MongoDB stores workflow with form data and empty steps
   - Each phase gets a corresponding step

3. **User Executes Steps**
   - Views WorkflowDetails page
   - Clicks "Execute Step" for a specific phase
   - POST to `/api/workflows/:id/execute` triggers:
     - Selected MCP tool (Gemini, ChatGPT, Claude)
     - Passes phase data as context
     - Returns generated content (requirements, design notes, test cases)

4. **Results Displayed**
   - Step results shown in expandable cards
   - User can review, edit, or export output
   - Update workflow status as phases complete

---

## 🎨 UI/UX Features

### Dashboard
- **Templates Grid**: Click-to-create workflow templates
- **Recent Workflows**: Latest 10 workflows with status badges
- **Quick Stats**: Total, completed, in-progress counts
- **Search/Filter**: Find workflows by name or phase (future)

### Workflow Builder
- **Step Progress**: Visual progress bar across phases
- **Phase Tabs**: Jump between selected phases
- **Form Validation**: Required field checking
- **Auto-save**: Draft workflows saved locally (future)

### Workflow Details
- **Timeline View**: Steps as collapsible cards
- **Status Badges**: Color-coded phase/status indicators
- **Execution Interface**: Run tools and view results
- **Status Manager**: Change workflow state (Draft → Completed)

### Design System
- **Color Palette**: Blue (primary), Green (secondary), Amber (accent)
- **Dark Mode**: Gradient slate backgrounds
- **Responsive**: Mobile, tablet, desktop layouts
- **Accessibility**: WCAG 2.1 AA compliance

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Server
PORT=10000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# AI Tools
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

### Frontend (.env.local)

```bash
VITE_API_URL=https://mcp-project-manager.onrender.com
```

---

## 📈 Performance

- **Backend**: < 100ms response time (cached)
- **Frontend**: LCP < 2.5s, FID < 100ms
- **Build**: Frontend bundle ~150KB (gzipped)
- **Database**: Indexed queries on workflow.name

---

## 🐛 Debugging

### Backend Logs
```bash
# Development (with auto-restart)
npm run dev

# Production logs on Render
# View in Render dashboard → Logs
```

### Frontend DevTools
- React DevTools browser extension
- Network tab for API debugging
- Console for JavaScript errors

### Common Issues

**API Connection Failed**
- Check backend is running: `curl http://localhost:10000/health`
- Verify `VITE_API_URL` in frontend .env
- Check CORS in Express: `res.header('Access-Control-Allow-Origin', '*')`

**Workflow Not Saving**
- Check MongoDB connection string
- Verify POST body format matches schema
- Check browser DevTools Network tab for errors

**Styles Not Applying**
- Rebuild Tailwind: `npm run build`
- Clear browser cache
- Check tailwind.config.js content paths

---

## 📞 Support & Contribution

**Repository**: [GitHub - mcp-project-manager](https://github.com/shivankbansal/mcp-project-manager)

**Report Issues**:
- Open GitHub issue with:
  - Reproduction steps
  - Expected vs actual behavior
  - Environment (Node/npm versions, browser, OS)

**Contributing**:
1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

---

## 📚 Additional Resources

- [MCP Protocol Docs](https://github.com/modelcontextprotocol/specification)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Guide](https://vitejs.dev/)
- [Express.js](https://expressjs.com/)

---

**Last Updated**: January 2025  
**Status**: Production Ready ✅
