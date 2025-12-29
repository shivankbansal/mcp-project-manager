import { Router, Request, Response } from 'express';
import { User, QUOTA_LIMITS } from '../models/User.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, extractToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const aupAcceptanceSchema = z.object({
  version: z.string().default('1.0')
});

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid registration data',
        details: validation.error.issues,
        requestId: req.id
      });
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'A user with this email already exists',
        requestId: req.id
      });
    }

    // Hash password
    const passwordHash = await (User as any).hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'free',
      quotas: {
        tier: 'free',
        hourly: {
          limit: QUOTA_LIMITS.free.hourly,
          used: 0,
          resetAt: new Date(Date.now() + 60 * 60 * 1000)
        },
        daily: {
          limit: QUOTA_LIMITS.free.daily,
          used: 0,
          resetAt: new Date(new Date().setHours(24, 0, 0, 0))
        }
      },
      aup: {
        accepted: false,
        version: '1.0'
      }
    });

    // Generate tokens
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.quotas.tier
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.quotas.tier
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.quotas.tier,
        aupAccepted: user.aup.accepted
      },
      token,
      refreshToken,
      requestId: req.id
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({
      error: 'Registration Failed',
      message: error.message || 'An error occurred during registration',
      requestId: req.id
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid login data',
        details: validation.error.issues,
        requestId: req.id
      });
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
        requestId: req.id
      });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
        requestId: req.id
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.quotas.tier
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.quotas.tier
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.quotas.tier,
        aupAccepted: user.aup.accepted,
        quotas: {
          hourly: {
            used: user.quotas.hourly.used,
            limit: user.quotas.hourly.limit,
            resetAt: user.quotas.hourly.resetAt
          },
          daily: {
            used: user.quotas.daily.used,
            limit: user.quotas.daily.limit,
            resetAt: user.quotas.daily.resetAt
          }
        }
      },
      token,
      refreshToken,
      requestId: req.id
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: error.message || 'An error occurred during login',
      requestId: req.id
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.get('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'No Token Provided',
        message: 'Refresh token is required',
        requestId: req.id
      });
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (error: any) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: error.message || 'Refresh token is invalid or expired',
        requestId: req.id
      });
    }

    // Fetch user
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User Not Found',
        message: 'The user associated with this token no longer exists',
        requestId: req.id
      });
    }

    // Generate new access token
    const newToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.quotas.tier
    });

    res.json({
      token: newToken,
      requestId: req.id
    });
  } catch (error: any) {
    console.error('[Auth] Refresh error:', error);
    res.status(500).json({
      error: 'Token Refresh Failed',
      message: error.message || 'An error occurred during token refresh',
      requestId: req.id
    });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.quotas.tier,
        aupAccepted: user.aup.accepted,
        quotas: {
          hourly: {
            used: user.quotas.hourly.used,
            limit: user.quotas.hourly.limit,
            resetAt: user.quotas.hourly.resetAt
          },
          daily: {
            used: user.quotas.daily.used,
            limit: user.quotas.daily.limit,
            resetAt: user.quotas.daily.resetAt
          }
        },
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      requestId: req.id
    });
  } catch (error: any) {
    console.error('[Auth] Get profile error:', error);
    res.status(500).json({
      error: 'Profile Fetch Failed',
      message: error.message || 'An error occurred while fetching profile',
      requestId: req.id
    });
  }
});

/**
 * Accept AUP
 * POST /api/auth/aup/accept
 */
router.post('/aup/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = aupAcceptanceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid AUP acceptance data',
        details: validation.error.issues,
        requestId: req.id
      });
    }

    const { version } = validation.data;
    const user = req.user!;

    user.aup.accepted = true;
    user.aup.version = version;
    user.aup.acceptedAt = new Date();
    await user.save();

    res.json({
      message: 'AUP accepted successfully',
      aup: {
        accepted: user.aup.accepted,
        version: user.aup.version,
        acceptedAt: user.aup.acceptedAt
      },
      requestId: req.id
    });
  } catch (error: any) {
    console.error('[Auth] AUP acceptance error:', error);
    res.status(500).json({
      error: 'AUP Acceptance Failed',
      message: error.message || 'An error occurred during AUP acceptance',
      requestId: req.id
    });
  }
});

/**
 * Get AUP document
 * GET /api/auth/aup
 */
router.get('/aup', (req: Request, res: Response) => {
  res.json({
    version: '1.0',
    title: 'Acceptable Use Policy',
    lastUpdated: '2025-12-29',
    url: '/ACCEPTABLE_USE_POLICY.md',
    summary: 'This policy governs the acceptable use of AI generation services',
    requestId: req.id
  });
});

export default router;
