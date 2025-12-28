# AI Providers Setup Guide

MCP Project Manager supports multiple AI providers for generating project documentation. Choose the one that best fits your needs.

## Quick Comparison

| Provider | Cost | Speed | Quality | Setup Difficulty | Best For |
|----------|------|-------|---------|------------------|----------|
| **Groq** | FREE | ⚡ Very Fast | High | Easy | Production (recommended) |
| **Ollama** | FREE | Fast | Medium-High | Medium | Self-hosted/Private |
| **OpenAI** | Paid | Fast | Very High | Easy | Maximum quality |
| **Gemini** | FREE tier | Medium | High | Easy | Google ecosystem |

---

## 🚀 Groq (Recommended for Production)

**Why Groq?** Free, extremely fast inference with powerful models like Llama 3.3 70B.

### Setup

1. **Get API Key** (FREE)
   - Visit [https://console.groq.com](https://console.groq.com)
   - Sign up with Google/GitHub
   - Go to **API Keys** section
   - Click **Create API Key**
   - Copy the key (starts with `gsk_...`)

2. **Add to `.env`**
   ```bash
   GROQ_API_KEY=gsk_your_api_key_here
   ```

3. **Verify Setup**
   ```bash
   npm run dev
   # Should see: "[AI Service] Using Groq with llama-3.3-70b-versatile"
   ```

### Usage

```bash
# Groq is auto-selected when available
curl -X POST http://localhost:10000/api/workflows/:id/execute \
  -H "Content-Type: application/json" \
  -d '{"stepId": "step-brd", "provider": "groq"}'
```

### Available Models
- **llama-3.3-70b-versatile** (default) - 70B parameters, excellent quality
- **mixtral-8x7b-32768** - Fast, good for long context
- **llama-3.1-8b-instant** - Super fast, decent quality

### Limits (Free Tier)
- **Requests**: 30 requests/minute
- **Tokens**: 6,000 tokens/minute
- **Daily**: No daily limit
- **Context**: Up to 32K tokens

### Pricing
- **FREE** - No credit card required
- Generous free tier suitable for production use

---

## 🏠 Ollama (Self-Hosted, Fully Private)

**Why Ollama?** Run AI models locally on your machine. No API keys, no internet required, complete privacy.

### Setup

1. **Install Ollama**

   **macOS/Linux:**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

   **Windows:**
   - Download from [https://ollama.com/download](https://ollama.com/download)
   - Run installer

2. **Download a Model**
   ```bash
   # Recommended: Llama 3.2 (3B parameters, fast)
   ollama pull llama3.2

   # Or larger model for better quality
   ollama pull llama3.1:8b
   ollama pull llama3.1:70b  # Requires 40GB+ RAM

   # Or Mixtral
   ollama pull mixtral
   ```

3. **Verify Ollama is Running**
   ```bash
   ollama list
   # Should show downloaded models

   curl http://localhost:11434/api/tags
   # Should return JSON with model list
   ```

4. **Configure `.env`**
   ```bash
   # Enable Ollama
   OLLAMA_ENABLED=true

   # Optional: specify model (default: llama3.2)
   OLLAMA_MODEL=llama3.2

   # Optional: custom host (default: http://localhost:11434)
   OLLAMA_HOST=http://localhost:11434
   ```

5. **Start Backend**
   ```bash
   npm run dev
   # Should see: "[AI Service] Using Ollama with llama3.2"
   ```

### Usage

```bash
curl -X POST http://localhost:10000/api/workflows/:id/execute \
  -H "Content-Type: application/json" \
  -d '{"stepId": "step-brd", "provider": "ollama"}'
```

### Recommended Models

| Model | Size | RAM Required | Quality | Speed |
|-------|------|--------------|---------|-------|
| llama3.2 | 3B | 4GB | Good | Very Fast |
| llama3.1:8b | 8B | 8GB | High | Fast |
| llama3.1:70b | 70B | 40GB | Excellent | Slow |
| mixtral | 47B | 32GB | Excellent | Medium |

### Performance Tips

```bash
# Use GPU acceleration (if available)
# Ollama automatically uses GPU if CUDA/Metal is available

# Monitor resource usage
ollama ps

# Stop a model to free RAM
ollama stop llama3.2
```

### Pros & Cons

✅ **Pros:**
- Completely free
- No API limits
- Full privacy (data never leaves your machine)
- No internet required
- Run custom/fine-tuned models

❌ **Cons:**
- Requires local resources (RAM, CPU/GPU)
- Setup complexity
- Slower than cloud APIs
- Need to download large model files

---

## 🤖 OpenAI (GPT-4o, Highest Quality)

**Why OpenAI?** Industry-leading quality with GPT-4o for the best documentation generation.

### Setup

1. **Get API Key**
   - Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create account (credit card required for pay-as-you-go)
   - Click **Create new secret key**
   - Copy key (starts with `sk-...`)

2. **Add to `.env`**
   ```bash
   OPENAI_API_KEY=sk-your_api_key_here
   ```

3. **Verify Setup**
   ```bash
   npm run dev
   # Test API call - should use OpenAI if no other provider is available
   ```

### Usage

```bash
curl -X POST http://localhost:10000/api/workflows/:id/execute \
  -H "Content-Type: application/json" \
  -d '{"stepId": "step-brd", "provider": "openai"}'
```

### Models Used
- **gpt-4o** (default) - Latest and most capable model
- Context: 128K tokens
- Output: Up to 16K tokens

### Pricing (Pay-as-you-go)
- **Input**: $2.50 / 1M tokens
- **Output**: $10.00 / 1M tokens
- **Typical Cost**: ~$0.05-0.15 per workflow step

### Example Costs
```
BRD Generation (4000 words):
- Input: ~500 tokens × $2.50/1M = $0.00125
- Output: ~6000 tokens × $10/1M = $0.06
- Total: ~$0.06 per BRD
```

---

## 🔷 Google Gemini (Free Tier Available)

**Why Gemini?** Good quality with generous free tier from Google.

### Setup

1. **Get API Key**
   - Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with Google account
   - Click **Create API Key**
   - Copy key (starts with `AIza...`)

2. **Add to `.env`**
   ```bash
   GOOGLE_API_KEY=AIza_your_api_key_here
   ```

3. **Verify Setup**
   ```bash
   npm run dev
   # Should see: "[AI Service] Using Gemini model: gemini-2.0-flash"
   ```

### Usage

```bash
curl -X POST http://localhost:10000/api/workflows/:id/execute \
  -H "Content-Type: application/json" \
  -d '{"stepId": "step-brd", "provider": "gemini"}'
```

### Models Used
- **gemini-2.0-flash** (default) - Fast, high-quality
- Context: 1M tokens
- Output: Up to 8K tokens

### Pricing
**Free Tier:**
- 15 requests/minute
- 1 million tokens/minute
- 1,500 requests/day

**Paid (if needed):**
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens

---

## Auto-Selection Priority

When `provider: "auto"` or no provider specified:

```
Priority Order:
1. Groq (if GROQ_API_KEY set) ← Recommended
2. Ollama (if OLLAMA_ENABLED=true)
3. OpenAI (if OPENAI_API_KEY set)
4. Gemini (if GOOGLE_API_KEY set)
```

---

## Environment Variables Reference

```bash
# Groq (Recommended - FREE & Fast)
GROQ_API_KEY=gsk_...

# Ollama (Self-hosted - FREE)
OLLAMA_ENABLED=true
OLLAMA_MODEL=llama3.2           # Optional, default: llama3.2
OLLAMA_HOST=http://localhost:11434  # Optional

# OpenAI (Paid - Highest Quality)
OPENAI_API_KEY=sk-...

# Google Gemini (Free Tier)
GOOGLE_API_KEY=AIza...

# Other Settings
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
```

---

## Testing Your Setup

### 1. Check Available Providers

```bash
curl http://localhost:10000/health
```

Response shows which providers are configured:
```json
{
  "status": "ok",
  "availableProviders": {
    "openai": false,
    "gemini": true,
    "groq": true,
    "ollama": false
  }
}
```

### 2. Test Document Generation

```bash
# Create a test workflow
WORKFLOW_ID=$(curl -s -X POST http://localhost:10000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "phases": ["brd"],
    "formData": {
      "projectName": "Test",
      "projectDescription": "Testing AI providers"
    }
  }' | jq -r '._id')

# Execute with specific provider
curl -X POST http://localhost:10000/api/workflows/$WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"stepId": "step-brd", "provider": "groq"}'
```

---

## Troubleshooting

### Groq

**Error: "API key invalid"**
```bash
# Verify key format (should start with gsk_)
echo $GROQ_API_KEY

# Regenerate key at console.groq.com
```

**Error: "Rate limit exceeded"**
```bash
# Free tier: 30 req/min, 6000 tokens/min
# Wait 60 seconds and retry
# Or upgrade at console.groq.com
```

### Ollama

**Error: "Ollama not available"**
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Verify endpoint
curl http://localhost:11434/api/tags
```

**Error: "Model not found"**
```bash
# List downloaded models
ollama list

# Pull the model
ollama pull llama3.2
```

**Slow generation?**
```bash
# Use smaller model
OLLAMA_MODEL=llama3.2  # 3B params, faster

# Or enable GPU acceleration (automatic if available)
# Check GPU usage: nvidia-smi (NVIDIA) or Activity Monitor (Mac)
```

### OpenAI

**Error: "Insufficient quota"**
```bash
# Add credits at platform.openai.com/account/billing
# Minimum: $5
```

**Error: "Invalid API key"**
```bash
# Verify key at platform.openai.com/api-keys
# Regenerate if needed
```

### Gemini

**Error: "API key not valid"**
```bash
# Regenerate at aistudio.google.com/app/apikey
# Ensure key starts with AIza
```

**Error: "Quota exceeded"**
```bash
# Free tier: 1500 requests/day
# Wait 24 hours or upgrade to paid tier
```

---

## Recommended Setup for Different Use Cases

### 🚀 Production / Public Deployment
```bash
GROQ_API_KEY=gsk_...  # Fast, free, reliable
```

### 🏢 Enterprise / Maximum Quality
```bash
OPENAI_API_KEY=sk_...  # Best quality
GROQ_API_KEY=gsk_...   # Fallback
```

### 🔒 Privacy-First / On-Premise
```bash
OLLAMA_ENABLED=true
OLLAMA_MODEL=llama3.1:70b  # Highest quality local model
```

### 💰 Budget-Conscious
```bash
GROQ_API_KEY=gsk_...      # Free, high quality
GOOGLE_API_KEY=AIza...    # Free tier fallback
```

### 🧪 Development / Testing
```bash
OLLAMA_ENABLED=true
OLLAMA_MODEL=llama3.2  # Fast local testing
GROQ_API_KEY=gsk_...   # Production testing
```

---

## Performance Comparison

Based on generating a typical BRD (3000-4000 words):

| Provider | Speed | Quality | Cost |
|----------|-------|---------|------|
| Groq (llama-3.3-70b) | 5-8 sec | ⭐⭐⭐⭐ | $0 |
| Ollama (llama3.2) | 30-60 sec | ⭐⭐⭐ | $0 |
| Ollama (llama3.1:70b) | 90-120 sec | ⭐⭐⭐⭐⭐ | $0 |
| OpenAI (gpt-4o) | 10-15 sec | ⭐⭐⭐⭐⭐ | $0.06 |
| Gemini (2.0-flash) | 8-12 sec | ⭐⭐⭐⭐ | $0 |

*Times measured on typical hardware (Ollama) and via API (cloud providers)*

---

## Support & Resources

### Groq
- [Console](https://console.groq.com)
- [Documentation](https://console.groq.com/docs)
- [Status](https://status.groq.com)

### Ollama
- [Official Site](https://ollama.com)
- [Models Library](https://ollama.com/library)
- [GitHub](https://github.com/ollama/ollama)

### OpenAI
- [Platform](https://platform.openai.com)
- [Documentation](https://platform.openai.com/docs)
- [Pricing](https://openai.com/pricing)

### Gemini
- [AI Studio](https://aistudio.google.com)
- [Documentation](https://ai.google.dev/docs)
- [Pricing](https://ai.google.dev/pricing)

---

**Recommendation**: Start with **Groq** for the best balance of speed, quality, and cost (free). Add **Ollama** for privacy-sensitive projects or offline use.

**Last Updated**: January 2025
