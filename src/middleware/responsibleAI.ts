import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Responsible AI Governance Middleware
 * Implements ethical AI usage, content safety, and abuse prevention
 */

// ===== CONFIGURATION =====

// Allowed providers and models
const ALLOWED_PROVIDERS = (process.env.ALLOWED_PROVIDERS || 'openai,gemini,groq,ollama').split(',');

const ALLOWED_MODELS = {
  openai: (process.env.ALLOWED_MODELS_OPENAI || 'gpt-4o,gpt-4o-mini,gpt-4-turbo').split(','),
  gemini: (process.env.ALLOWED_MODELS_GEMINI || 'gemini-2.0-flash-exp,gemini-1.5-flash,gemini-1.5-pro').split(','),
  groq: (process.env.ALLOWED_MODELS_GROQ || 'llama-3.3-70b-versatile,mixtral-8x7b-32768').split(','),
  ollama: (process.env.ALLOWED_MODELS_OLLAMA || 'llama3.2,qwen2.5,mistral').split(',')
};

// Permitted use cases
const PERMITTED_PURPOSES = [
  'product_documentation',
  'business_requirements',
  'design_specifications',
  'user_journey_mapping',
  'test_case_generation',
  'technical_documentation',
  'ui_ux_design',
  'api_documentation'
];

// Safety configuration
const ENABLE_SAFETY_CHECKS = process.env.ENABLE_SAFETY_CHECKS !== 'false';
const REQUIRE_PURPOSE = process.env.REQUIRE_PURPOSE !== 'false';

// ===== CONTENT SAFETY PATTERNS =====

// Dangerous patterns (reject if found)
const FORBIDDEN_PATTERNS = {
  // PII patterns
  pii: [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit card
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email (multiple)
    /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
  ],

  // Secrets/credentials
  secrets: [
    /(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer[_-]?token)["\s:=]+[a-zA-Z0-9_\-]{20,}/gi,
    /(?:password|passwd|pwd)["\s:=]+[^\s]{8,}/gi,
    /(?:private[_-]?key|rsa[_-]?private)["\s:=]+-----BEGIN/gi,
    /(?:aws[_-]?access[_-]?key|aws[_-]?secret)/gi,
  ],

  // Malicious content
  malware: [
    /(?:eval|exec|system|shell_exec|passthru)\s*\(/gi,
    /<script[^>]*>[\s\S]*<\/script>/gi,
    /(?:drop|delete|truncate)\s+(?:table|database)/gi,
    /(?:union|select|insert|update)\s+.*\s+from\s+/gi,
  ],

  // Harmful content
  harmful: [
    /(?:how to (?:make|build|create) (?:bomb|explosive|weapon))/gi,
    /(?:suicide|self-harm|kill (?:myself|yourself))/gi,
    /(?:hack|exploit|bypass|crack) (?:password|account|system)/gi,
  ]
};

// ===== AUDIT LOGGING =====

interface AuditLogData {
  timestamp: Date;
  userId: string | null;
  ip: string;
  workflowId?: string;
  provider: string;
  aiModel?: string;
  purpose?: string;
  inputHash: string;
  inputSize: number;
  decision: 'allow' | 'deny';
  reason?: string;
  safetyFlags?: string[];
  outputSize?: number;
  tokenCount?: number;
  requestId: string;
}

// In-memory cache for quick access (last 1000 logs)
const auditLogsCache: AuditLogData[] = [];

async function logAIGeneration(log: AuditLogData) {
  // Add to in-memory cache for quick access
  auditLogsCache.push(log);

  // Keep only last 1000 logs in memory
  if (auditLogsCache.length > 1000) {
    auditLogsCache.shift();
  }

  // Log to console
  console.log('[AI Audit]', JSON.stringify({
    ...log,
    timestamp: log.timestamp.toISOString(),
    // Redact sensitive data
    inputHash: log.inputHash.substring(0, 16) + '...',
  }));

  // Alert on deny decisions
  if (log.decision === 'deny') {
    console.warn('[AI Audit] DENIED:', log.reason, {
      requestId: log.requestId,
      userId: log.userId,
      ip: log.ip,
      flags: log.safetyFlags
    });
  }

  // Persist to database (non-blocking)
  AuditLog.create(log).catch(err => {
    console.error('[AI Audit] Failed to persist to database:', err.message);
    // Don't fail the request if DB write fails
  });
}

// Export audit logs from cache (for quick access)
export function getAuditLogsFromCache(limit: number = 100): AuditLogData[] {
  return auditLogsCache.slice(-limit);
}

// Export function to query from database (for admin panel)
export async function getAuditLogsFromDB(options: {
  limit?: number;
  userId?: string;
  decision?: 'allow' | 'deny';
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const { limit = 100, userId, decision, startDate, endDate } = options;

  const query: any = {};
  if (userId) query.userId = userId;
  if (decision) query.decision = decision;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}

// ===== SAFETY CHECKS =====

function checkContentSafety(text: string): { safe: boolean; flags: string[] } {
  if (!ENABLE_SAFETY_CHECKS) {
    return { safe: true, flags: [] };
  }

  const flags: string[] = [];

  // Check PII
  for (const pattern of FORBIDDEN_PATTERNS.pii) {
    if (pattern.test(text)) {
      flags.push('pii_detected');
      break;
    }
  }

  // Check secrets
  for (const pattern of FORBIDDEN_PATTERNS.secrets) {
    if (pattern.test(text)) {
      flags.push('secrets_detected');
      break;
    }
  }

  // Check malware
  for (const pattern of FORBIDDEN_PATTERNS.malware) {
    if (pattern.test(text)) {
      flags.push('malware_pattern_detected');
      break;
    }
  }

  // Check harmful content
  for (const pattern of FORBIDDEN_PATTERNS.harmful) {
    if (pattern.test(text)) {
      flags.push('harmful_content_detected');
      break;
    }
  }

  return {
    safe: flags.length === 0,
    flags
  };
}

// ===== MIDDLEWARE =====

// Provider and model allowlist enforcement
export const enforceProviderAllowlist = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const provider = req.body?.provider || 'auto';

  // Allow 'auto' (server decides)
  if (provider === 'auto') {
    return next();
  }

  // Check if provider is allowed
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return res.status(403).json({
      error: 'Forbidden Provider',
      message: `Provider '${provider}' is not allowed`,
      allowedProviders: ALLOWED_PROVIDERS,
      requestId: req.id
    });
  }

  // Check if specific model is requested
  if (req.body?.model) {
    const model = req.body.model;
    const allowedModels = ALLOWED_MODELS[provider as keyof typeof ALLOWED_MODELS] || [];

    if (!allowedModels.includes(model)) {
      return res.status(403).json({
        error: 'Forbidden Model',
        message: `Model '${model}' is not allowed for provider '${provider}'`,
        allowedModels,
        requestId: req.id
      });
    }
  }

  next();
};

// Purpose validation
export const requirePurpose = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!REQUIRE_PURPOSE) {
    return next();
  }

  const purpose = req.body?.purpose;

  if (!purpose) {
    return res.status(400).json({
      error: 'Purpose Required',
      message: 'You must specify a purpose for this AI generation',
      permittedPurposes: PERMITTED_PURPOSES,
      requestId: req.id
    });
  }

  if (!PERMITTED_PURPOSES.includes(purpose)) {
    return res.status(403).json({
      error: 'Invalid Purpose',
      message: `Purpose '${purpose}' is not permitted`,
      permittedPurposes: PERMITTED_PURPOSES,
      requestId: req.id
    });
  }

  next();
};

// Input safety check
export const checkInputSafety = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const prompt = req.body?.prompt || '';
  const context = req.body?.context || '';
  const combinedInput = `${prompt} ${context}`;

  // Check content safety
  const { safe, flags } = checkContentSafety(combinedInput);

  // Create input hash for audit
  const inputHash = Buffer.from(combinedInput).toString('base64').substring(0, 32);

  // Log audit entry with request ID
  const auditLog: AuditLogData = {
    timestamp: new Date(),
    userId: (req as any).userId || null,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    workflowId: req.params?.id,
    provider: req.body?.provider || 'auto',
    aiModel: req.body?.model,
    purpose: req.body?.purpose,
    inputHash,
    inputSize: combinedInput.length,
    decision: safe ? 'allow' : 'deny',
    safetyFlags: flags.length > 0 ? flags : undefined,
    requestId: req.id || 'unknown'
  };

  if (!safe) {
    auditLog.reason = `Content safety violation: ${flags.join(', ')}`;
    logAIGeneration(auditLog);

    return res.status(400).json({
      error: 'Content Safety Violation',
      message: 'Your input contains forbidden content',
      flags,
      details: 'Please remove sensitive information like PII, credentials, or harmful content',
      requestId: req.id
    });
  }

  // Store audit log on request for later use
  (req as any).auditLog = auditLog;

  logAIGeneration(auditLog);
  next();
};

// Output safety check and marking
export const markAIOutput = (output: string, metadata: any): string => {
  // Check output safety
  const { safe, flags } = checkContentSafety(output);

  if (!safe) {
    console.warn('[AI Output] Safety flags detected:', flags);
    // Optionally redact or warn in output
  }

  // Add AI-generated marker
  const marker = `\n\n---\n*🤖 AI-Generated Content*\n` +
    `Provider: ${metadata.provider || 'auto'} | ` +
    `Model: ${metadata.model || 'default'} | ` +
    `Generated: ${new Date().toISOString()} | ` +
    `Request ID: ${metadata.requestId || 'unknown'}`;

  return output + marker;
};

// Generation rate limiting (stricter than general API)
export const aiGenerationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.GEN_RATE_LIMIT_PER_HOUR || '20'), // 20 generations per hour
  message: (req: Request) => ({
    error: 'AI Generation Rate Limit Exceeded',
    message: 'Too many AI generation requests. Please try again later.',
    retryAfter: '1 hour',
    requestId: req.id
  }),
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for health checks
  skip: (req) => req.path === '/health'
});

// Daily quota check (simplified in-memory implementation)
const dailyQuotas: Map<string, { date: string; count: number }> = new Map();

export const checkDailyQuota = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const dailyLimit = parseInt(process.env.GEN_RATE_LIMIT_PER_DAY || '100');
  const userId = (req as any).userId || req.ip || 'anonymous';
  const today = new Date().toISOString().split('T')[0];

  let quota = dailyQuotas.get(userId);

  // Reset if new day
  if (!quota || quota.date !== today) {
    quota = { date: today, count: 0 };
    dailyQuotas.set(userId, quota);
  }

  // Check limit
  if (quota.count >= dailyLimit) {
    return res.status(429).json({
      error: 'Daily Quota Exceeded',
      message: `You have exceeded your daily limit of ${dailyLimit} AI generations`,
      used: quota.count,
      limit: dailyLimit,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      requestId: req.id
    });
  }

  // Increment counter
  quota.count++;

  next();
};

// AUP acceptance check (placeholder - implement with user model)
export const requireAUPAcceptance = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Check user's AUP acceptance status in database
  // For now, check header
  const aupAccepted = req.get('X-AUP-Accepted');

  if (process.env.REQUIRE_AUP === 'true' && aupAccepted !== 'true') {
    return res.status(403).json({
      error: 'AUP Acceptance Required',
      message: 'You must accept the Acceptable Use Policy before using AI generation',
      aupUrl: '/aup',
      requestId: req.id
    });
  }

  next();
};

// ===== CONFIGURATION EXPORT =====

export const responsibleAIConfig = {
  allowedProviders: ALLOWED_PROVIDERS,
  allowedModels: ALLOWED_MODELS,
  permittedPurposes: PERMITTED_PURPOSES,
  safetyChecksEnabled: ENABLE_SAFETY_CHECKS,
  purposeRequired: REQUIRE_PURPOSE,
  rateLimit: {
    perHour: parseInt(process.env.GEN_RATE_LIMIT_PER_HOUR || '20'),
    perDay: parseInt(process.env.GEN_RATE_LIMIT_PER_DAY || '100')
  }
};
