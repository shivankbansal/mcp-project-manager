import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * Generates a unique ID for each request for tracing and correlation
 */

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  // Check if request ID already exists (e.g., from load balancer)
  const existingId = req.get('X-Request-ID') || req.get('X-Request-Id');
  
  // Generate new ID if not present
  req.id = existingId || randomUUID();
  
  // Add to response headers for client correlation
  res.setHeader('X-Request-ID', req.id);
  
  next();
};
