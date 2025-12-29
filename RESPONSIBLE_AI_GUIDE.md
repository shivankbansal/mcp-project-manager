# 🤖 Responsible AI Implementation Guide

## Overview

This guide documents the Responsible AI governance framework implemented in MCP Project Manager to ensure ethical, safe, and compliant use of AI-powered generation services.

---

## 🎯 Goals

1. **Prevent Misuse**: Block harmful, fraudulent, or malicious content
2. **Protect Privacy**: Prevent PII and credential leakage
3. **Ensure Compliance**: Meet regulatory requirements (GDPR, CCPA, AI Act)
4. **Maintain Trust**: Transparent, auditable, and accountable AI usage
5. **Enable Innovation**: Allow legitimate use cases while preventing abuse

---

## 🛡️ Implementation Status

### ✅ Completed

**Technical Guardrails** (`src/middleware/responsibleAI.ts`):
- ✅ Provider & model allowlist enforcement
- ✅ Purpose binding and validation
- ✅ Input/output content safety filters
- ✅ PII/credentials/malware detection
- ✅ Rate limiting (hourly + daily quotas)
- ✅ Audit logging with immutable logs
- ✅ AI-generated content marking

**Policy & Documentation**:
- ✅ Acceptable Use Policy (AUP)
- ✅ Implementation guide (this document)
- ✅ Configuration via environment variables

### 🔄 In Progress

- [ ] Apply to workflow routes
- [ ] UI AUP acceptance gate
- [ ] User-specific quotas
- [ ] Admin audit log viewer

### 📋 Roadmap

- [ ] JWT-based authentication
- [ ] Provider-native safety APIs (OpenAI Moderation, Gemini Safety)
- [ ] Human-in-the-loop review queue
- [ ] Compliance reports (GDPR, CCPA)
- [ ] Advanced threat detection (ML-based)

---

## 🔧 Configuration

### Environment Variables

```bash
# === Responsible AI Settings ===

# Provider allowlist (comma-separated)
ALLOWED_PROVIDERS=openai,gemini,groq,ollama

# Model allowlists per provider
ALLOWED_MODELS_OPENAI=gpt-4o,gpt-4o-mini,gpt-4-turbo
ALLOWED_MODELS_GEMINI=gemini-2.0-flash-exp,gemini-1.5-flash,gemini-1.5-pro
ALLOWED_MODELS_GROQ=llama-3.3-70b-versatile,mixtral-8x7b-32768
ALLOWED_MODELS_OLLAMA=llama3.2,qwen2.5,mistral

# Safety features
ENABLE_SAFETY_CHECKS=true          # Enable content filtering
REQUIRE_PURPOSE=true               # Require purpose field
REQUIRE_AUP=true                   # Require AUP acceptance

# Rate limits
GEN_RATE_LIMIT_PER_HOUR=20        # Max generations per hour per user/IP
GEN_RATE_LIMIT_PER_DAY=100        # Max generations per day per user/IP

# Audit logging
AUDIT_LOG_RETENTION_DAYS=90       # How long to keep audit logs
```

### Render Dashboard Setup

1. Go to your Render service dashboard
2. Navigate to Environment tab
3. Add the variables above
4. Click "Save Changes"
5. Service will auto-redeploy with new config

---

## 🚨 Safety Features

### 1. Content Safety Filters

**Input Filtering** (blocks before AI call):

| Category | Detection Method | Examples |
|----------|------------------|----------|
| **PII** | Regex patterns | SSN, credit cards, emails, phones |
| **Credentials** | Pattern matching | API keys, passwords, tokens |
| **Malware** | Code analysis | SQL injection, XSS, shell commands |
| **Harmful Content** | Keyword detection | Violence, self-harm, illegal activities |

**Output Monitoring** (checks after AI response):
- Same patterns as input
- Flags suspicious content
- Logs violations
- Optional redaction

### 2. Provider & Model Control

**Allowlist Enforcement**:
```typescript
// ✅ Allowed
{ provider: 'openai', model: 'gpt-4o' }
{ provider: 'groq', model: 'llama-3.3-70b-versatile' }

// ❌ Blocked
{ provider: 'custom-provider' }  // Not in ALLOWED_PROVIDERS
{ provider: 'openai', model: 'gpt-3.5-turbo' }  // Not in allowlist
```

**Benefits**:
- Prevents unauthorized models
- Controls costs (expensive models)
- Ensures quality standards
- Compliance with licensing

### 3. Purpose Binding

**Required Purpose Field**:
```json
{
  "prompt": "Create a BRD for...",
  "provider": "groq",
  "purpose": "business_requirements"
}
```

**Permitted Purposes**:
- `product_documentation`
- `business_requirements`
- `design_specifications`
- `user_journey_mapping`
- `test_case_generation`
- `technical_documentation`
- `ui_ux_design`
- `api_documentation`

**Benefits**:
- Tracks intent
- Prevents out-of-scope use
- Enables category-based rules
- Improves audit trail

### 4. Rate Limiting & Quotas

**Three-Tier Limits**:

1. **General API** (from security.ts):
   - 100 requests per 15 minutes
   - All `/api/*` endpoints

2. **AI Generation** (hourly):
   - 20 generations per hour
   - Per user/IP
   - Configurable via env

3. **AI Generation** (daily):
   - 100 generations per day
   - Resets at midnight
   - Prevents quota abuse

**Response on Limit**:
```json
{
  "error": "AI Generation Rate Limit Exceeded",
  "message": "Too many AI generation requests. Please try again later.",
  "retryAfter": "1 hour",
  "used": 20,
  "limit": 20
}
```

### 5. Audit Logging

**What Gets Logged**:
```typescript
{
  timestamp: "2025-12-29T10:30:45.123Z",
  userId: "user_123" | null,
  ip: "192.168.1.100",
  workflowId: "wf_456",
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  purpose: "business_requirements",
  inputHash: "a3f2b1c9...",  // SHA-256 hash
  inputSize: 1234,           // characters
  decision: "allow" | "deny",
  reason: "Content safety violation: pii_detected",
  safetyFlags: ["pii_detected"],
  outputSize: 5678,
  tokenCount: 890
}
```

**Storage**:
- In-memory array (last 10,000 logs)
- Can be upgraded to database (MongoDB, PostgreSQL)
- Exported via admin endpoint
- Immutable (append-only)

**Retention**:
- Default: 90 days
- Configurable: 7-365 days
- Auto-deletion after retention period

### 6. AI-Generated Content Marking

**Output Marker**:
```markdown
[Your AI-generated content here]

---
*🤖 AI-Generated Content*
Provider: groq | Model: llama-3.3-70b-versatile | Generated: 2025-12-29T10:30:45Z | Request ID: req_abc123
```

**Benefits**:
- Transparency (users know it's AI)
- Traceability (request ID for audit)
- Compliance (AI Act, disclosure requirements)
- Trust (honesty about AI usage)

---

## 🔌 Integration Points

### Backend Routes

**Apply to Workflow Generation**:

```typescript
import {
  enforceProviderAllowlist,
  requirePurpose,
  checkInputSafety,
  aiGenerationRateLimit,
  checkDailyQuota,
  requireAUPAcceptance
} from '../middleware/responsibleAI.js';

// Streaming generation
router.post('/generate/stream',
  aiGenerationRateLimit,      // Rate limit first
  checkDailyQuota,             // Check daily quota
  requireAUPAcceptance,        // Require AUP
  enforceProviderAllowlist,    // Check provider/model
  requirePurpose,              // Require purpose field
  checkInputSafety,            // Safety check input
  validate(streamGenerationSchema),
  async (req, res) => {
    // ... generation logic ...

    // Mark output before sending
    const markedOutput = markAIOutput(output, {
      provider: req.body.provider,
      model: usedModel,
      requestId: req.id
    });
  }
);

// Execute workflow phase
router.post('/:id/execute',
  aiGenerationRateLimit,
  checkDailyQuota,
  requireAUPAcceptance,
  enforceProviderAllowlist,
  requirePurpose,
  checkInputSafety,
  validate(executeWorkflowSchema),
  async (req, res) => {
    // ... execution logic ...
  }
);
```

### Frontend UI

**AUP Acceptance Gate**:

```jsx
import { useState } from 'react';

function WorkflowGenerator() {
  const [aupAccepted, setAupAccepted] = useState(
    localStorage.getItem('aup_accepted') === 'true'
  );

  if (!aupAccepted) {
    return <AUPAcceptanceDialog onAccept={() => {
      setAupAccepted(true);
      localStorage.setItem('aup_accepted', 'true');
    }} />;
  }

  // ... normal UI ...

  // Send AUP acceptance in headers
  const generateWorkflow = async () => {
    await fetch('/api/workflows/generate/stream', {
      headers: {
        'X-AUP-Accepted': 'true'
      },
      body: JSON.stringify({
        prompt,
        provider,
        purpose: 'business_requirements'  // Always include
      })
    });
  };
}
```

**Provider/Model Lock Indicator**:

```jsx
function ProviderSelector() {
  return (
    <div>
      <label>AI Provider</label>
      <select value={provider} onChange={...}>
        <option value="auto">🤖 Auto-Select (Recommended)</option>
        <option value="groq">⚡ Groq - Approved ✓</option>
        <option value="openai">🧠 OpenAI - Approved ✓</option>
        <option value="gemini">💎 Gemini - Approved ✓</option>
      </select>
      <p className="text-xs text-muted">
        🔒 Provider and model selection is controlled for compliance and quality.
        <a href="/responsible-ai">Learn more</a>
      </p>
    </div>
  );
}
```

**AI-Generated Marker**:

```jsx
function PhaseContent({ content, metadata }) {
  return (
    <div>
      <ReactMarkdown>{content}</ReactMarkdown>

      {metadata.aiGenerated && (
        <div className="ai-marker">
          <span>🤖 AI-Generated Content</span>
          <span>Provider: {metadata.provider}</span>
          <span>Model: {metadata.model}</span>
          <span>Generated: {metadata.timestamp}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing

### Test Safety Filters

```bash
# Should DENY - PII detected
curl -X POST http://localhost:10000/api/workflows/generate/stream \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "My SSN is 123-45-6789 and email is user@example.com",
    "provider": "groq",
    "purpose": "business_requirements"
  }'
# Expected: 400 Content Safety Violation

# Should DENY - Harmful content
curl -X POST http://localhost:10000/api/workflows/generate/stream \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How to hack a password",
    "provider": "groq",
    "purpose": "business_requirements"
  }'
# Expected: 400 Content Safety Violation

# Should DENY - Forbidden provider
curl -X POST http://localhost:10000/api/workflows/generate/stream \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a BRD",
    "provider": "custom-llm",
    "purpose": "business_requirements"
  }'
# Expected: 403 Forbidden Provider

# Should ALLOW - Valid request
curl -X POST http://localhost:10000/api/workflows/generate/stream \
  -H "Content-Type: application/json" \
  -H "X-AUP-Accepted: true" \
  -d '{
    "prompt": "Create a BRD for a mobile banking app",
    "provider": "groq",
    "purpose": "business_requirements"
  }'
# Expected: 200 SSE stream
```

### Test Rate Limiting

```bash
# Make 21 requests (hourly limit is 20)
for i in {1..21}; do
  curl -X POST http://localhost:10000/api/workflows/generate/stream \
    -H "Content-Type: application/json" \
    -H "X-AUP-Accepted: true" \
    -d '{
      "prompt": "Test $i",
      "provider": "groq",
      "purpose": "business_requirements"
    }'
  echo "Request $i"
done
# Expected: First 20 succeed, 21st returns 429
```

### Check Audit Logs

```bash
# Admin endpoint (TODO: protect with auth)
curl http://localhost:10000/api/audit/ai-logs?limit=50
# Expected: JSON array of last 50 audit logs
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Track

1. **Safety Violations**:
   - Count by flag type (pii, secrets, harmful, malware)
   - Trend over time
   - User/IP patterns

2. **Rate Limit Hits**:
   - Hourly vs daily
   - Per user/IP
   - Spike detection

3. **Provider/Model Usage**:
   - Distribution across providers
   - Model popularity
   - Cost tracking

4. **Purpose Categories**:
   - Most common use cases
   - Unusual purposes
   - Out-of-scope attempts

5. **AUP Compliance**:
   - Acceptance rate
   - Time to accept
   - Rejections

### Alert Conditions

**Immediate Alerts** (high priority):
- Multiple safety violations from same user/IP (5+ in 1 hour)
- Credential/PII pattern detected in input/output
- Harmful content generation attempt
- Rate limit circumvention attempts

**Warning Alerts** (medium priority):
- Daily quota exceeded by multiple users
- Unusual provider/model requests
- High deny rate (>10% of requests)

**Info Alerts** (low priority):
- New user first generation
- Provider availability changes
- Configuration updates

### Logging Best Practices

```typescript
// ✅ Good - Structured, sanitized
console.log(JSON.stringify({
  event: 'ai_generation_denied',
  reason: 'pii_detected',
  userId: 'user_123',
  ip: '192.168.1.100',
  timestamp: new Date().toISOString(),
  inputHash: 'abc123...',  // Hash, not full input
  flags: ['pii_detected']
}));

// ❌ Bad - Exposes PII
console.log('Denied input:', userInput);  // DON'T LOG RAW INPUT
```

---

## 🔒 Compliance

### GDPR (EU)

**Right to Access**:
- Users can view their audit logs
- Export as JSON
- Request ID for traceability

**Right to Erasure**:
- Delete user's audit logs
- Remove from generation history
- Retain for legal obligations (90 days max)

**Data Minimization**:
- Log input hash, not full content
- No PII in logs
- Aggregate metrics only

**Purpose Limitation**:
- Purpose field enforced
- Only approved use cases
- Audit trail for compliance

### CCPA (California)

**Right to Know**:
- What data we collect (prompts, metadata)
- Why we collect it (abuse detection, compliance)
- Who we share with (AI providers only)

**Right to Delete**:
- Delete personal data on request
- Exceptions: legal, security, fraud

**Do Not Sell**:
- We don't sell user data
- We don't train on user data

### AI Act (EU - upcoming)

**Transparency**:
- AI-generated content marked
- Provider and model disclosed
- Request ID for traceability

**Human Oversight**:
- Admin can review
- Human-in-the-loop for high-risk
- Appeal process

**Risk Management**:
- Content safety filters
- Bias monitoring (TODO)
- Impact assessments (TODO)

---

## 🚀 Deployment Checklist

### Before Deployment

- [ ] Review and customize AUP for your organization
- [ ] Set environment variables in Render dashboard
- [ ] Test safety filters with malicious inputs
- [ ] Verify rate limiting works
- [ ] Check audit logging is functioning
- [ ] Ensure provider/model allowlist is correct

### After Deployment

- [ ] Monitor audit logs for violations
- [ ] Check rate limit effectiveness
- [ ] Review denied requests
- [ ] Adjust quotas if needed
- [ ] Train team on AUP
- [ ] Set up alerting (Sentry, etc.)

### Ongoing

- [ ] Weekly audit log review
- [ ] Monthly safety filter tuning
- [ ] Quarterly AUP updates
- [ ] Annual compliance audit

---

## 📚 Resources

- [Acceptable Use Policy](./ACCEPTABLE_USE_POLICY.md)
- [Security Implementation Guide](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [OpenAI Usage Policies](https://openai.com/policies/usage-policies)
- [Google AI Principles](https://ai.google/responsibility/principles/)
- [EU AI Act Summary](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)

---

**Status**: ✅ Framework Implemented
**Next Steps**: Apply to routes, add UI controls, implement admin panel
**Priority**: High - deploy ASAP for production safety

🤖 Responsible AI is not optional - it's essential for trust, compliance, and long-term success!
