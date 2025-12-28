# Quick Start Guide - MCP Project Manager

Get up and running with MCP Project Manager in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- Git installed
- Code editor (VS Code recommended)

## 1. Clone the Repository

```bash
git clone https://github.com/shivankbansal/mcp-project-manager.git
cd mcp-project-manager
```

## 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

## 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

**Choose ONE of these AI providers** (Groq recommended for free & fast):

### Option A: Groq (FREE - Recommended)

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up and get your API key
3. Add to `.env`:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```

### Option B: Ollama (FREE - Self-hosted)

1. Install Ollama: [https://ollama.com/download](https://ollama.com/download)
2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. Add to `.env`:
   ```bash
   OLLAMA_ENABLED=true
   ```

### Option C: OpenAI (Paid)

1. Get API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to `.env`:
   ```bash
   OPENAI_API_KEY=sk_your_key_here
   ```

### Option D: Google Gemini (FREE tier)

1. Get API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Add to `.env`:
   ```bash
   GOOGLE_API_KEY=AIza_your_key_here
   ```

## 4. Start the Servers

Open two terminals:

**Terminal 1 - Backend:**
```bash
npm run dev
```
Should see: `HTTP server on port 10000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Should see: `Local: http://localhost:5173`

## 5. Open the App

Visit **http://localhost:5173** in your browser.

## 6. Create Your First Workflow

1. **Click a template** on the dashboard (e.g., "Full Project Lifecycle")
2. **Fill the form** with your project details:
   - Project name: "My E-commerce Platform"
   - Description: "Online shopping platform"
   - Target audience: "Tech-savvy shoppers"
   - Features: "Product catalog, cart, checkout"
3. **Click "Next"** to move through phases
4. **Submit** when done

## 7. Execute Workflow Steps

1. **Click on your workflow** in the dashboard
2. **Click "Execute Step"** for any phase
3. **Wait** for AI to generate documentation
4. **View results** in the expandable card

## Test the API

```bash
# Check health
curl http://localhost:10000/health

# List workflows
curl http://localhost:10000/api/workflows

# List available tools
curl http://localhost:10000/api/tools
```

## Common Issues

### Backend won't start?

```bash
# Check Node version (needs 20+)
node --version

# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't start?

```bash
# Ensure you're in frontend directory
cd frontend

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### No AI providers available?

```bash
# Check your .env file has at least one provider
cat .env | grep -E 'GROQ|OLLAMA|OPENAI|GOOGLE'

# Test health endpoint to see which are configured
curl http://localhost:10000/health
```

### Ollama not working?

```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Verify model is downloaded
ollama pull llama3.2
```

## Next Steps

- Read the [AI Providers Setup Guide](AI_PROVIDERS.md) for detailed provider configuration
- Check the [API Reference](API_REFERENCE.md) for API documentation
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute to the project
- Read [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for complete technical details

## Deploy to Production

### Backend (Already Live on Render)
✅ https://mcp-project-manager.onrender.com

### Frontend (Deploy to Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Set environment variable
# VITE_API_URL=https://mcp-project-manager.onrender.com
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Support

- **Issues**: [GitHub Issues](https://github.com/shivankbansal/mcp-project-manager/issues)
- **Documentation**: Check the `/docs` directory
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**That's it! You're ready to manage project workflows with AI assistance.** 🚀

**Time to first workflow**: ~5 minutes
**Status**: Production Ready ✅
