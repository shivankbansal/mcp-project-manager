# Frontend - MCP Project Manager

Vite + React UI connecting to backend at `/api`.

## Setup

```bash
cd frontend
npm install
npm run dev      # Dev server on :3000
npm run build    # Build for production
```

## Environment

Set `VITE_API_URL` to backend URL (e.g., on Vercel, set env var pointing to Render backend).

## Deploy to Vercel

1. Connect repo to Vercel
2. Set Root Directory to `frontend`
3. Set env var `VITE_API_URL=https://your-render-backend.onrender.com`
4. Deploy
