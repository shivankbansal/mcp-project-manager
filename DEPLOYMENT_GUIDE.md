# 🚀 Deployment Guide - MCP Project Manager

## Quick Deployment Overview

```
┌─────────────────────────────────────────────────────┐
│         MCP Project Manager Architecture            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Frontend                Backend                    │
│  (React + Vite)        (Node.js + Express)         │
│  ↓                     ↓                            │
│  Vercel              Render                        │
│  https://...         https://mcp-project-manager   │
│                      .onrender.com ✅ LIVE         │
│                                                      │
│  Environment Variable: VITE_API_URL                │
│  Points to: Render backend URL                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Backend Deployment ✅

**Status**: Already deployed on Render  
**URL**: https://mcp-project-manager.onrender.com  
**Health Check**: https://mcp-project-manager.onrender.com/health

### Verify Backend Health

```bash
curl https://mcp-project-manager.onrender.com/health
# Should return: {"status":"ok",...}
```

---

## Frontend Deployment 🔄

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Push code to GitHub
```bash
cd /Users/shivankbansal/Documents/mcp-project-manager
git status
git push  # Already done! ✅
```

#### Step 2: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Click "New Project"
4. Select `mcp-project-manager` repo
5. Configure project:
   - **Framework**: React
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: `dist`

#### Step 3: Set Environment Variables

In Vercel dashboard:
- Name: `VITE_API_URL`
- Value: `https://mcp-project-manager.onrender.com`

#### Step 4: Deploy

Click "Deploy" - Vercel will build and deploy automatically!

**Your frontend will be available at**: `https://<your-project>.vercel.app`

---

### Option 2: Deploy to Netlify

#### Step 1: Connect GitHub to Netlify
1. Go to [https://netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select `mcp-project-manager` repo

#### Step 2: Configure Build Settings
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

#### Step 3: Set Environment Variables
- `VITE_API_URL`: `https://mcp-project-manager.onrender.com`

#### Step 4: Deploy
Netlify will auto-deploy on every push!

---

### Option 3: Deploy Manually to Any Server

#### Local Build

```bash
cd frontend
npm run build
# Creates: frontend/dist/
```

#### Serve Built Files

```bash
# Using Python 3
cd frontend/dist
python3 -m http.server 3000

# Or using Node.js
npx serve -s dist -l 3000
```

#### Upload to Server
```bash
# Using scp, rsync, FTP, etc.
scp -r frontend/dist/* user@server.com:/var/www/html/
```

---

## Environment Variables

### Frontend (.env.local)

```bash
VITE_API_URL=https://mcp-project-manager.onrender.com
```

### Backend (Already Set in Render)

Render dashboard → Settings → Environment Variables:
- `PORT=10000`
- `NODE_ENV=production`
- `MONGODB_URI=<optional>`
- `OPENAI_API_KEY=<optional>`
- `ANTHROPIC_API_KEY=<optional>`
- `GOOGLE_API_KEY=<optional>`

---

## Testing After Deployment

### 1. Check Frontend is Running

```bash
# Visit the deployed URL in browser
# Should see: Dashboard with templates
```

### 2. Verify Backend Connection

In browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Click "New Workflow"
4. Fill form and submit
5. Should see successful POST request to `/api/workflows`

### 3. Test Workflow Creation

```bash
# Verify backend has received the workflow
curl https://mcp-project-manager.onrender.com/api/workflows
# Should return: [{"name":"...","description":"..."}]
```

---

## Common Deployment Issues

### Issue: API calls returning 404

**Solution**: Check `VITE_API_URL` environment variable
```bash
# Vercel: Project Settings → Environment Variables
# Ensure VITE_API_URL points to Render backend
```

### Issue: CORS errors in browser console

**Solution**: Backend CORS already configured, but verify:
```javascript
// src/server.ts should have:
app.use(cors())
```

### Issue: Frontend showing old version

**Solution**: 
1. Hard refresh browser (Cmd+Shift+R on Mac)
2. Clear cache in DevTools
3. Verify build was deployed

### Issue: Build fails on Vercel

**Checklist**:
- [ ] `Root Directory` set to `frontend`
- [ ] `package.json` exists in `frontend/`
- [ ] All dependencies listed: `react-router-dom`, `axios`, `tailwindcss`
- [ ] Build command is `npm run build`

---

## Deployment Checklist

- [x] Backend deployed on Render
- [x] Backend health check passing
- [x] Frontend code in GitHub
- [ ] Frontend deployed to Vercel/Netlify
- [ ] `VITE_API_URL` environment variable set
- [ ] Test workflow creation end-to-end
- [ ] Test all 4 phases (BRD, Design, Journey, Testing)
- [ ] Test workflow details and execution
- [ ] Verify responsive design on mobile

---

## Performance Tips

### Frontend Optimization

```bash
# Check bundle size
npm run build
# dist/ folder should be < 500KB

# Lighthouse audit
# Target: 90+ on all metrics
```

### Backend Optimization

- [ ] Enable caching headers
- [ ] Compress responses (gzip)
- [ ] Index MongoDB queries
- [ ] Monitor API response times

---

## Monitoring & Logs

### Frontend (Vercel)
- Dashboard → Project → Deployments
- View logs, analytics, performance metrics

### Backend (Render)
- Dashboard → Services → mcp-project-manager
- View logs in real-time
- Check CPU/Memory usage

---

## Continuous Deployment

Once deployed, every push to GitHub will:
1. Trigger build on Vercel/Netlify
2. Run tests (if configured)
3. Deploy to production automatically

### Rollback (if needed)

**Vercel**:
- Dashboard → Deployments
- Click previous deployment
- Click "Redeploy"

**Render**:
- Dashboard → Deployments
- Click previous deployment
- Click "Redeploy"

---

## Next Steps After Deployment

1. ✅ Test all features in production
2. ✅ Share link with team
3. ✅ Gather feedback
4. ✅ Plan feature enhancements
5. ✅ Monitor performance metrics
6. ✅ Set up error tracking (Sentry, etc.)
7. ✅ Add authentication (optional)
8. ✅ Setup automated backups (MongoDB)

---

## Resources

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Render Docs](https://render.com/docs)
- [GitHub Actions CI/CD](https://github.com/features/actions)

---

**Deployment Status**:
- ✅ Backend: Live on Render
- 🔄 Frontend: Ready for Vercel/Netlify
- 📊 Architecture: Production-ready

**Ready to deploy!** 🚀
