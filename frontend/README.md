# MCP Project Manager - Frontend

A modern, production-grade React application for managing project workflows from Business Requirements through Design, User Journeys, and Test Cases.

## ✨ Features

### 🎯 Multi-Phase Workflow Management
- **Business Requirements (BRD)**: Define project scope, features, timeline, and budget
- **Design & Wireframes**: Create UI/UX specifications with color schemes and accessibility notes
- **User Journey & Workflows**: Map user personas, flows, pain points, and success metrics
- **Test Cases & QA**: Define comprehensive testing strategies and performance targets

### 📊 Dashboard
- View workflow templates with phase breakdown
- Browse recent workflows with quick status checks
- Real-time workflow statistics and progress tracking
- One-click workflow creation from templates

### 🛠️ Workflow Builder
- Multi-step form covering all phases
- Flexible template selection (Full Lifecycle, Requirements→Design, Test Coverage, Documentation)
- Progress tracking and phase navigation
- Form data persistence across steps

### 📈 Workflow Details & Execution
- Step-by-step execution interface
- Real-time result viewing and AI tool integration
- Status management (Draft → In Progress → Completed)
- Timeline and progress visualization

### 🎨 Modern UI/UX
- Dark mode with gradient backgrounds
- Responsive Tailwind CSS design
- Smooth animations and transitions
- Professional component styling

## 🚀 Quick Start

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will start on `http://localhost:5173` and proxy API calls to your backend (default: `http://localhost:10000`).

### Building for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx        # Main dashboard with templates and recent workflows
│   │   ├── WorkflowBuilder.jsx  # Multi-step workflow creation form
│   │   └── WorkflowDetails.jsx  # Workflow execution and status tracking
│   ├── App.jsx                   # Router and layout component
│   ├── App.css                   # Tailwind configuration and custom styles
│   ├── index.css                 # Global styles
│   └── main.jsx                  # React root entry point
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🔌 API Integration

The frontend communicates with the backend API at:
- **Development**: `http://localhost:10000` (configurable via `VITE_API_URL`)
- **Production**: Set `VITE_API_URL` environment variable

### Required API Endpoints

- `GET /api/workflows` — Fetch all workflows
- `POST /api/workflows` — Create new workflow
- `GET /api/workflows/:id` — Get workflow details
- `PUT /api/workflows/:id` — Update workflow status
- `DELETE /api/workflows/:id` — Delete workflow
- `POST /api/workflows/:id/execute` — Execute workflow step
- `GET /api/tools` — List available tools

## 🎨 Customization

### Colors & Theme
Edit `tailwind.config.js` to customize:
- Primary color (blue)
- Secondary color (green)
- Accent color (amber)
- Dark background

### Workflow Phases
Modify `WORKFLOW_PHASES` and `WORKFLOW_TEMPLATES` in component files to customize:
- Available phases
- Form fields
- Template descriptions

## 📦 Dependencies

- **react-router-dom** — Client-side routing
- **axios** — HTTP client for API calls
- **tailwindcss** — Utility-first CSS framework
- **vite** — Next generation frontend build tool

## 🌐 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

**Environment Variables:**
```
VITE_API_URL=https://your-backend-api.com
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🛠️ Development Tips

- Hot module reloading enabled (modify files and see changes instantly)
- Debug mode: Check browser console for API responses
- Use React DevTools for component inspection
- Test with different screen sizes (responsive design)

## 📝 Notes

- Workflows are stored in MongoDB if configured; otherwise in-memory
- API proxy configured in `vite.config.js` for development
- Tailwind CSS classes used throughout for consistent styling
- Forms validate required fields before submission

## 🐛 Troubleshooting

**API calls failing?**
- Check backend is running on correct port
- Verify `VITE_API_URL` environment variable
- Check browser console for CORS errors

**Styles not applying?**
- Ensure Tailwind build completed: `npm run build`
- Check tailwind.config.js content paths
- Clear browser cache and rebuild

**Workflows not loading?**
- Verify backend `/api/workflows` endpoint
- Check MongoDB connection if used
- Check network tab in DevTools

## 📞 Support

For issues or feature requests, open an issue on GitHub.
2. Set Root Directory to `frontend`
3. Set env var `VITE_API_URL=https://your-render-backend.onrender.com`
4. Deploy
