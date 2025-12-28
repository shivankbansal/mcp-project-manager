# 🔐 Security Implementation Guide

## Status: ✅ Stage 1 Complete - Quick Hardening

### Implemented Security Measures

#### 1. Security Middleware (`src/middleware/security.ts`)

✅ **Helmet** - Security headers configured:
- HSTS (Force HTTPS, 1 year, includeSubDomains, preload)
- Hide X-Powered-By
- Frameguard (prevent clickjacking)
- XSS Filter
- No MIME sniffing
- Referrer Policy: strict-origin-when-cross-origin
- Content Security Policy with restrictive directives

✅ **Rate Limiting**:
- General API: 100 requests per 15 minutes
- Strict (for expensive ops): 10 requests per 15 minutes
- Streaming: 20 requests per hour
- Health checks excluded from rate limits

✅ **CORS Whitelist**:
- Configurable via `ALLOWED_ORIGINS` environment variable
- Defaults: localhost:5173, localhost:3000, devtrifecta-ui.onrender.com
- Logs blocked origins
- No credentials allowed (safer)

✅ **Request Validation**:
- Content-Type checking for POST/PUT
- Body size validation (1MB limit)
- Input sanitization (removes null bytes)

✅ **Admin Protection**:
- `requireAdmin` middleware (checks X-Admin-Token header)
- Backward compatible (allows if no token configured)

✅ **Tool Execution Protection**:
- `disableToolExecution` middleware
- Blocks tool execution in production (NODE_ENV=production)

#### 2. Input Validation (`src/middleware/validation.ts`)

✅ **Zod Schemas** for all endpoints:
- `createWorkflowSchema` - Workflow creation with field limits
- `updateWorkflowSchema` - Only allows specific fields
- `executeWorkflowSchema` - Phase execution validation
- `streamGenerationSchema` - Streaming generation (10-10000 chars)
- `quickstartSchema` - Quickstart validation
- `toolExecutionSchema` - Tool execution validation
- `answerSubmissionSchema` - Answer submission validation

✅ **Validation Middleware**:
- `validate(schema)` - Factory for schema validation
- Replaces request body with validated data (removes extra fields)
- Returns 400 with detailed error messages

✅ **Path Parameter Validation**:
- `validateMongoId()` - Validates MongoDB ObjectId or numeric ID

#### 3. Server Configuration (`src/server.ts`)

✅ **Applied Security Layers**:
1. Helmet security headers
2. CORS whitelist
3. Body parsing (1MB limit)
4. Request validation
5. Input sanitization
6. Rate limiting on `/api/*`

✅ **Protected Endpoints**:
- `/api/tools/execute` - Disabled in production + validation
- All routes get rate limiting
- All POST/PUT get input sanitization

✅ **Error Handling**:
- 404 handler for unknown routes
- Global error handler
- No stack traces in production
- Sanitized error messages

---

## 🚀 Stage 2: Workflow Routes Security (TODO)

### Changes Needed in `src/routes/workflowRoutes.ts`

#### Import Security Middleware

```typescript
import {
  strictRateLimit,
  streamRateLimit,
  requireAdmin
} from '../middleware/security.js';
import {
  validate,
  validateMongoId,
  createWorkflowSchema,
  updateWorkflowSchema,
  executeWorkflowSchema,
  streamGenerationSchema,
  quickstartSchema,
  answerSubmissionSchema
} from '../middleware/validation.js';
```

#### Apply to Routes

```typescript
// CREATE - with validation
router.post('/',
  validate(createWorkflowSchema),
  async (req: Request, res: Response) => {
    // Use validated req.body (already sanitized)
  }
);

// UPDATE - with validation and ID check
router.put('/:id',
  validateMongoId(),
  validate(updateWorkflowSchema),
  async (req: Request, res: Response) => {
    // Only allow whitelisted fields
  }
);

// DELETE - require admin
router.delete('/:id',
  validateMongoId(),
  requireAdmin,
  async (req: Request, res: Response) => {
    // Admin-only deletion
  }
);

// EXECUTE - strict rate limit + validation
router.post('/:id/execute',
  validateMongoId(),
  strictRateLimit,
  validate(executeWorkflowSchema),
  async (req: Request, res: Response) => {
    // Expensive AI generation
  }
);

// STREAM - stream rate limit + validation
router.post('/generate/stream',
  streamRateLimit,
  validate(streamGenerationSchema),
  async (req: Request, res: Response) => {
    // Long-lived SSE connection
  }
);

// QUICKSTART - strict rate limit + validation
router.post('/quickstart',
  strictRateLimit,
  validate(quickstartSchema),
  async (req: Request, res: Response) => {
    // AI generation
  }
);

// ANSWER - validation
router.post('/:id/answer',
  validateMongoId(),
  validate(answerSubmissionSchema),
  async (req: Request, res: Response) => {
    // Answer submission
  }
);
```

---

## 🎨 Stage 3: Frontend Security (TODO)

### Content Sanitization

#### Install rehype-sanitize

```bash
cd frontend
npm install rehype-sanitize
```

#### Update WorkflowDetails.jsx

```javascript
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

// In component
<ReactMarkdown
  rehypePlugins={[rehypeSanitize]}
  components={{
    a: ({ node, ...props }) => (
      <a {...props} rel="noopener noreferrer" target="_blank" />
    )
  }}
>
  {content}
</ReactMarkdown>
```

---

## 🔧 Environment Variables

### Backend (.env)

```bash
# Security
NODE_ENV=production
ALLOWED_ORIGINS=https://devtrifecta-ui.onrender.com
ADMIN_TOKEN=your-secure-random-token-here

# Existing
OPENAI_API_KEY=...
GEMINI_API_KEY=...
GROQ_API_KEY=...
MONGODB_URI=...
```

### Render Configuration

Add to `render.yaml` or dashboard:
- `NODE_ENV`: production
- `ALLOWED_ORIGINS`: https://devtrifecta-ui.onrender.com
- `ADMIN_TOKEN`: (generate secure token)

---

## 📊 Security Checklist

### ✅ Completed (Stage 1)

- [x] Helmet security headers
- [x] CORS whitelist
- [x] Rate limiting (general, strict, streaming)
- [x] Input validation schemas (Zod)
- [x] Request body sanitization
- [x] Tool execution disabled in production
- [x] Error handling (no stack traces in prod)
- [x] 404 handler
- [x] Admin middleware (token-based)

### 🔄 In Progress (Stage 2)

- [ ] Apply validation to workflow routes
- [ ] Apply rate limits to expensive endpoints
- [ ] Protect DELETE with admin middleware
- [ ] Add MongoDB ID validation to routes

### 📋 TODO (Stage 3+)

- [ ] Frontend Markdown sanitization (rehype-sanitize)
- [ ] JWT authentication (replace X-Admin-Token)
- [ ] CSRF protection (if using cookies)
- [ ] Request logging (structured, sanitized)
- [ ] Dependency audits (npm audit, Snyk)
- [ ] Secrets rotation procedure
- [ ] WAF consideration (Cloudflare)

---

## 🧪 Testing Security

### Test Rate Limiting

```bash
# Should block after 100 requests
for i in {1..105}; do
  curl https://mcp-project-manager.onrender.com/api/workflows
  echo "Request $i"
done
```

### Test CORS

```bash
# Should block unknown origins
curl -H "Origin: https://evil.com" \
  https://mcp-project-manager.onrender.com/api/workflows
```

### Test Tool Execution (Production)

```bash
# Should return 403 in production
curl -X POST https://mcp-project-manager.onrender.com/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "test", "args": {}}'
```

### Test Validation

```bash
# Should return 400 - invalid data
curl -X POST https://mcp-project-manager.onrender.com/api/workflows/generate/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "too short"}'
```

---

## 📈 Monitoring

### Key Metrics to Track

1. **Rate Limit Hits**: How often users hit limits
2. **CORS Blocks**: Unknown origins attempting access
3. **Validation Errors**: Bad request patterns
4. **Tool Execution Attempts**: Should be 0 in production
5. **Error Rates**: 500s, 400s, 403s

### Logging Enhancements

```typescript
// Add to server.ts or middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip
    }));
  });
  next();
});
```

---

## 🔐 Security Best Practices

### Do's ✅

- ✅ Use environment variables for secrets
- ✅ Validate all inputs
- ✅ Rate limit expensive operations
- ✅ Whitelist CORS origins
- ✅ Sanitize outputs (especially user-generated content)
- ✅ Use HTTPS (enforced by Helmet HSTS)
- ✅ Keep dependencies updated
- ✅ Log security events

### Don'ts ❌

- ❌ Don't log secrets or tokens
- ❌ Don't expose stack traces in production
- ❌ Don't allow arbitrary tool execution
- ❌ Don't trust client input
- ❌ Don't use `eval()` or similar
- ❌ Don't hardcode credentials
- ❌ Don't skip input validation
- ❌ Don't allow mass-assignment

---

## 🚀 Deployment Steps

### 1. Update Dependencies

```bash
npm install
cd frontend && npm install
```

### 2. Set Environment Variables

On Render dashboard:
- Add `NODE_ENV=production`
- Add `ALLOWED_ORIGINS=https://devtrifecta-ui.onrender.com`
- Add `ADMIN_TOKEN=<generate-secure-token>`

### 3. Deploy

```bash
git add .
git commit -m "🔐 Add comprehensive security hardening"
git push origin main
```

### 4. Verify

- Check health: https://mcp-project-manager.onrender.com/health
- Test CORS: Should block unknown origins
- Test rate limits: Should enforce limits
- Test tool execution: Should return 403

---

**Status**: Stage 1 Complete ✅
**Next**: Apply validation to workflow routes (Stage 2)
**Priority**: High - deploy Stage 1, then implement Stage 2

🔐 Security is an ongoing process - stay vigilant!
