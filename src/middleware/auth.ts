import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken, JWTPayload } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

/**
 * Require authentication middleware
 * Verifies JWT and attaches user to request
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.get('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'No authentication token provided',
        requestId: req.id
      });
    }

    // Verify token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (error: any) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: error.message || 'Token verification failed',
        requestId: req.id
      });
    }

    // Fetch user from database
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        error: 'User Not Found',
        message: 'The user associated with this token no longer exists',
        requestId: req.id
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error: any) {
    console.error('[Auth] Error in requireAuth:', error);
    return res.status(500).json({
      error: 'Authentication Error',
      message: 'An error occurred during authentication',
      requestId: req.id
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.get('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      // No token, continue without user
      return next();
    }

    // Verify token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      // Invalid token, continue without user (don't fail request)
      return next();
    }

    // Fetch user
    const user = await User.findById(payload.userId);

    if (user) {
      req.user = user;
      req.userId = user._id.toString();
    }

    next();
  } catch (error) {
    // Errors in optional auth should not fail the request
    next();
  }
};

/**
 * Require specific role(s)
 * Must be used AFTER requireAuth
 */
export const requireRole = (roles: Array<'admin' | 'pro' | 'free'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'You must be authenticated to access this resource',
        requestId: req.id
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: `This resource requires one of the following roles: ${roles.join(', ')}`,
        yourRole: req.user.role,
        requestId: req.id
      });
    }

    next();
  };
};

/**
 * Require admin role
 * Convenience middleware for admin-only routes
 */
export const requireAdminRole = requireRole(['admin']);

/**
 * Require AUP acceptance
 * Must be used AFTER requireAuth
 */
export const requireAUPAcceptanceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'You must be authenticated to access this resource',
      requestId: req.id
    });
  }

  if (!req.user.aup.accepted) {
    return res.status(403).json({
      error: 'AUP Acceptance Required',
      message: 'You must accept the Acceptable Use Policy before using AI generation',
      aupUrl: '/api/auth/aup',
      requestId: req.id
    });
  }

  next();
};

/**
 * Check user quota
 * Must be used AFTER requireAuth
 */
export const checkUserQuota = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'You must be authenticated to access this resource',
      requestId: req.id
    });
  }

  const user = req.user;
  const now = new Date();

  // Reset quotas if needed (pre-save hook handles this, but double-check)
  if (user.quotas.hourly.resetAt < now) {
    user.quotas.hourly.used = 0;
    user.quotas.hourly.resetAt = new Date(now.getTime() + 60 * 60 * 1000);
  }

  if (user.quotas.daily.resetAt < now) {
    user.quotas.daily.used = 0;
    user.quotas.daily.resetAt = new Date(new Date().setHours(24, 0, 0, 0));
  }

  // Check hourly quota
  if (user.quotas.hourly.used >= user.quotas.hourly.limit) {
    return res.status(429).json({
      error: 'Hourly Quota Exceeded',
      message: `You have exceeded your hourly limit of ${user.quotas.hourly.limit} AI generations`,
      tier: user.quotas.tier,
      used: user.quotas.hourly.used,
      limit: user.quotas.hourly.limit,
      resetsAt: user.quotas.hourly.resetAt.toISOString(),
      upgradeUrl: '/upgrade',
      requestId: req.id
    });
  }

  // Check daily quota
  if (user.quotas.daily.used >= user.quotas.daily.limit) {
    return res.status(429).json({
      error: 'Daily Quota Exceeded',
      message: `You have exceeded your daily limit of ${user.quotas.daily.limit} AI generations`,
      tier: user.quotas.tier,
      used: user.quotas.daily.used,
      limit: user.quotas.daily.limit,
      resetsAt: user.quotas.daily.resetAt.toISOString(),
      upgradeUrl: '/upgrade',
      requestId: req.id
    });
  }

  // Increment quotas
  user.quotas.hourly.used++;
  user.quotas.daily.used++;
  await user.save();

  next();
};
