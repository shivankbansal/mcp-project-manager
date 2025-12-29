import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // 30 days

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'pro' | 'free';
  tier: 'free' | 'pro' | 'enterprise';
}

/**
 * Generate access token (7 days)
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mcp-project-manager',
    audience: 'mcp-api'
  } as jwt.SignOptions);
}

/**
 * Generate refresh token (30 days)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'mcp-project-manager',
    audience: 'mcp-api-refresh'
  } as jwt.SignOptions);
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mcp-project-manager',
      audience: 'mcp-api'
    }) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mcp-project-manager',
      audience: 'mcp-api-refresh'
    }) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}
