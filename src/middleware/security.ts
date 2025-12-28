import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware Configuration
 * Implements defense-in-depth with helmet, rate limiting, and input validation
 */

// Helmet configuration - Security headers
export const securityHeaders = helmet({
  // HSTS - Force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // XSS Protection
  xssFilter: true,

  // Prevent MIME sniffing
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Needed for inline styles
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
});

// Rate limiting - General API
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Rate limiting - Strict (for expensive operations)
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many generation requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting - Streaming endpoints
export const streamRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 streaming requests per hour
  message: 'Too many streaming requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration
export const getCorsOptions = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://devtrifecta-ui.onrender.com'
      ];

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: false, // Don't allow credentials for now
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  };
};

// Request validation middleware
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check content type for POST/PUT
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json'
      });
    }
  }

  // Check request body size (already limited in express.json, but double-check)
  if (req.body && JSON.stringify(req.body).length > 1024 * 1024) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body exceeds 1MB limit'
    });
  }

  next();
};

// Sanitize input middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    // Remove null bytes
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\0/g, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitize(value);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitize(req.body);
  }

  next();
};

// Admin authentication middleware (placeholder - implement with JWT)
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Implement JWT authentication
  // For now, check for admin token in headers
  const adminToken = req.get('X-Admin-Token');
  const validAdminToken = process.env.ADMIN_TOKEN;

  if (!validAdminToken) {
    // If no admin token configured, allow (backward compatibility)
    return next();
  }

  if (adminToken !== validAdminToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  next();
};

// Disable tool execution in production
export const disableToolExecution = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Tool execution is disabled in production'
    });
  }
  next();
};
