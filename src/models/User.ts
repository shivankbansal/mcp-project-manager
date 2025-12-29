import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'pro' | 'free';
  quotas: {
    tier: 'free' | 'pro' | 'enterprise';
    hourly: {
      limit: number;
      used: number;
      resetAt: Date;
    };
    daily: {
      limit: number;
      used: number;
      resetAt: Date;
    };
  };
  aup: {
    accepted: boolean;
    version: string;
    acceptedAt?: Date;
  };
  createdAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'pro', 'free'],
    default: 'free'
  },
  quotas: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    hourly: {
      limit: { type: Number, default: 10 }, // free tier: 10/hour
      used: { type: Number, default: 0 },
      resetAt: { type: Date, default: () => new Date(Date.now() + 60 * 60 * 1000) }
    },
    daily: {
      limit: { type: Number, default: 50 }, // free tier: 50/day
      used: { type: Number, default: 0 },
      resetAt: { type: Date, default: () => new Date(new Date().setHours(24, 0, 0, 0)) }
    }
  },
  aup: {
    accepted: { type: Boolean, default: false },
    version: { type: String, default: '1.0' },
    acceptedAt: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'quotas.tier': 1 });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to hash password
userSchema.statics.hashPassword = async function(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// Pre-save hook to update lastLogin
userSchema.pre('save', function(next) {
  // Reset quotas if needed
  const now = new Date();

  // Reset hourly quota
  if (this.quotas.hourly.resetAt < now) {
    this.quotas.hourly.used = 0;
    this.quotas.hourly.resetAt = new Date(now.getTime() + 60 * 60 * 1000);
  }

  // Reset daily quota
  if (this.quotas.daily.resetAt < now) {
    this.quotas.daily.used = 0;
    this.quotas.daily.resetAt = new Date(new Date().setHours(24, 0, 0, 0));
  }

  next();
});

export const User = mongoose.model<IUser>('User', userSchema);

// Quota limits by tier
export const QUOTA_LIMITS = {
  free: {
    hourly: 10,
    daily: 50
  },
  pro: {
    hourly: 50,
    daily: 500
  },
  enterprise: {
    hourly: 200,
    daily: 2000
  }
};
