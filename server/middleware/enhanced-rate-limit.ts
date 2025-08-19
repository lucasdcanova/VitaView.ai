import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction, Express } from 'express';
import { createHash } from 'crypto';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message: any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

interface AdaptiveRateLimitOptions {
  baseMax: number;
  windowMs: number;
  increaseThreshold: number;
  decreaseThreshold: number;
  maxIncrease: number;
  message: any;
}

class EnhancedRateLimit {
  private userRequestCounts = new Map<string, { count: number; window: number; violations: number }>();
  private ipRequestCounts = new Map<string, { requests: number[]; violations: number }>();
  private suspiciousIPs = new Set<string>();
  
  // Sliding window rate limiter
  createSlidingWindowLimiter(config: RateLimitConfig): RateLimitRequestHandler {
    return rateLimit({
      ...config,
      keyGenerator: (req: Request) => {
        // Use combination of IP and user ID if authenticated
        const userId = (req as any).user?.id;
        const ip = this.getClientIP(req);
        
        if (userId) {
          return `user:${userId}:${ip}`;
        }
        return `ip:${ip}`;
      },
      handler: (req: Request, res: Response) => {
        const key = this.getClientIP(req);
        this.trackSuspiciousActivity(key);
        
        res.status(429).json({
          ...config.message,
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }
    });
  }

  // Adaptive rate limiter that adjusts based on user behavior
  createAdaptiveRateLimiter(options: AdaptiveRateLimitOptions): RateLimitRequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getClientIP(req);
      const now = Date.now();
      const windowStart = now - options.windowMs;
      
      // Clean old requests
      if (this.ipRequestCounts.has(key)) {
        const userData = this.ipRequestCounts.get(key)!;
        userData.requests = userData.requests.filter(timestamp => timestamp > windowStart);
      } else {
        this.ipRequestCounts.set(key, { requests: [], violations: 0 });
      }
      
      const userData = this.ipRequestCounts.get(key)!;
      
      // Calculate adaptive limit
      const violationPenalty = Math.min(userData.violations * 2, options.maxIncrease);
      const currentMax = Math.max(1, options.baseMax - violationPenalty);
      
      if (userData.requests.length >= currentMax) {
        userData.violations++;
        this.trackSuspiciousActivity(key);
        
        return res.status(429).json({
          ...options.message,
          currentLimit: currentMax,
          violations: userData.violations,
          timestamp: new Date().toISOString()
        });
      }
      
      userData.requests.push(now);
      next();
    };
  }

  // Token bucket rate limiter for burst tolerance
  createTokenBucketLimiter(bucketSize: number, refillRate: number, windowMs: number) {
    const buckets = new Map<string, { tokens: number; lastRefill: number }>();
    
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getClientIP(req);
      const now = Date.now();
      
      if (!buckets.has(key)) {
        buckets.set(key, { tokens: bucketSize, lastRefill: now });
      }
      
      const bucket = buckets.get(key)!;
      
      // Refill tokens
      const timePassed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor((timePassed / windowMs) * refillRate);
      bucket.tokens = Math.min(bucketSize, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
      
      if (bucket.tokens < 1) {
        this.trackSuspiciousActivity(key);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please slow down',
          retryAfter: Math.ceil(windowMs / refillRate / 1000)
        });
      }
      
      bucket.tokens--;
      next();
    };
  }

  // Geographic-based rate limiting
  createGeographicRateLimiter(config: RateLimitConfig & { restrictedCountries?: string[] }) {
    return rateLimit({
      ...config,
      keyGenerator: (req: Request) => {
        const ip = this.getClientIP(req);
        const country = this.getCountryFromIP(ip);
        const isRestricted = config.restrictedCountries?.includes(country || '');
        
        return `geo:${country}:${ip}:${isRestricted ? 'restricted' : 'normal'}`;
      },
      max: (req: Request) => {
        const ip = this.getClientIP(req);
        const country = this.getCountryFromIP(ip);
        const isRestricted = config.restrictedCountries?.includes(country || '');
        
        return isRestricted ? Math.floor(config.max * 0.5) : config.max;
      }
    });
  }

  // Behavioral analysis rate limiter
  createBehavioralRateLimiter(config: RateLimitConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getClientIP(req);
      const behaviorScore = this.calculateBehaviorScore(req);
      
      // Adjust rate limit based on behavior
      const adjustedMax = Math.floor(config.max * behaviorScore);
      
      if (adjustedMax < 1) {
        this.trackSuspiciousActivity(key);
        return res.status(429).json({
          error: 'Suspicious behavior detected',
          message: 'Your request pattern suggests automated behavior',
          behaviorScore,
          timestamp: new Date().toISOString()
        });
      }
      
      // Apply standard rate limiting with adjusted max
      const limiter = rateLimit({
        ...config,
        max: adjustedMax,
        keyGenerator: () => key
      });
      
      limiter(req, res, next);
    };
  }

  // Progressive penalty system
  createProgressivePenaltyLimiter(config: RateLimitConfig) {
    const violations = new Map<string, { count: number; lastViolation: number }>();
    
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getClientIP(req);
      const now = Date.now();
      
      // Check if IP has violations
      if (violations.has(key)) {
        const violationData = violations.get(key)!;
        const timeSinceLastViolation = now - violationData.lastViolation;
        
        // Reset violations after 24 hours of good behavior
        if (timeSinceLastViolation > 24 * 60 * 60 * 1000) {
          violations.delete(key);
        } else {
          // Apply progressive penalty
          const penaltyMultiplier = Math.min(violationData.count, 10);
          const penaltyTime = config.windowMs * penaltyMultiplier;
          
          if (timeSinceLastViolation < penaltyTime) {
            return res.status(429).json({
              error: 'Progressive penalty active',
              message: `Penalty active due to ${violationData.count} violations`,
              penaltyEndsAt: new Date(violationData.lastViolation + penaltyTime).toISOString()
            });
          }
        }
      }
      
      // Apply standard rate limiting
      const limiter = rateLimit({
        ...config,
        keyGenerator: () => key,
        onLimitReached: () => {
          if (!violations.has(key)) {
            violations.set(key, { count: 0, lastViolation: now });
          }
          const violationData = violations.get(key)!;
          violationData.count++;
          violationData.lastViolation = now;
        }
      });
      
      limiter(req, res, next);
    };
  }

  // Apply enhanced rate limiting to Express app
  applyEnhancedRateLimiting(app: Express) {
    // Critical authentication endpoints - Progressive penalty
    const authLimiter = this.createProgressivePenaltyLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: {
        error: 'Too many authentication attempts',
        type: 'auth_limit_exceeded'
      },
      skipSuccessfulRequests: false
    });
    
    // Upload endpoints - Token bucket for burst tolerance
    const uploadLimiter = this.createTokenBucketLimiter(10, 5, 60 * 1000);
    
    // AI analysis - Adaptive rate limiting
    const aiLimiter = this.createAdaptiveRateLimiter({
      baseMax: 20,
      windowMs: 60 * 60 * 1000,
      increaseThreshold: 5,
      decreaseThreshold: 2,
      maxIncrease: 15,
      message: {
        error: 'AI analysis limit exceeded',
        type: 'ai_limit_exceeded'
      }
    });
    
    // General API - Behavioral analysis
    const apiLimiter = this.createBehavioralRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        error: 'Rate limit exceeded',
        type: 'general_limit_exceeded'
      }
    });
    
    // Apply limiters
    app.use('/api/login', authLimiter);
    app.use('/api/register', authLimiter);
    app.use('/api/forgot-password', authLimiter);
    app.use('/api/upload', uploadLimiter);
    app.use('/api/exams/upload', uploadLimiter);
    app.use('/api/analyze', aiLimiter);
    app.use('/api/exams/quick-summary', aiLimiter);
    app.use('/api/', apiLimiter);
    
    // Suspicious IP blocking middleware
    app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIP(req);
      
      if (this.suspiciousIPs.has(ip)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been flagged for suspicious activity',
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    });
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return remoteAddress || 'unknown';
  }

  private getCountryFromIP(ip: string): string | null {
    // This would integrate with a GeoIP service like MaxMind or IPinfo
    // For now, return null as placeholder
    return null;
  }

  private calculateBehaviorScore(req: Request): number {
    let score = 1.0;
    
    // Check User-Agent
    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent || userAgent.length < 10) {
      score *= 0.5; // Suspicious or missing user agent
    }
    
    // Check for common bot patterns
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /node/i
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      score *= 0.3;
    }
    
    // Check request headers
    const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const presentHeaders = expectedHeaders.filter(header => req.headers[header]);
    score *= (presentHeaders.length / expectedHeaders.length);
    
    // Check for automation indicators
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      score *= 1.1; // Slightly prefer AJAX requests
    }
    
    // Referrer check
    const referer = req.headers.referer;
    if (referer && (referer.includes(req.headers.host || '') || referer.includes('localhost'))) {
      score *= 1.2; // Prefer requests from same origin
    }
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private trackSuspiciousActivity(ip: string) {
    const key = `suspicious:${ip}`;
    const now = Date.now();
    
    if (!this.userRequestCounts.has(key)) {
      this.userRequestCounts.set(key, { count: 0, window: now, violations: 0 });
    }
    
    const data = this.userRequestCounts.get(key)!;
    data.violations++;
    
    // Flag as suspicious after 5 violations in 1 hour
    if (data.violations >= 5) {
      this.suspiciousIPs.add(ip);
      console.warn(`[Security] IP ${ip} flagged as suspicious after ${data.violations} violations`);
      
      // Auto-remove from suspicious list after 24 hours
      setTimeout(() => {
        this.suspiciousIPs.delete(ip);
        console.info(`[Security] IP ${ip} removed from suspicious list`);
      }, 24 * 60 * 60 * 1000);
    }
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Clean old user request counts
    for (const [key, data] of this.userRequestCounts.entries()) {
      if (data.window < oneDayAgo) {
        this.userRequestCounts.delete(key);
      }
    }
    
    // Clean old IP request counts
    for (const [key, data] of this.ipRequestCounts.entries()) {
      data.requests = data.requests.filter(timestamp => timestamp > oneDayAgo);
      if (data.requests.length === 0 && data.violations === 0) {
        this.ipRequestCounts.delete(key);
      }
    }
  }
}

export const enhancedRateLimit = new EnhancedRateLimit();

// Run cleanup every hour
setInterval(() => {
  enhancedRateLimit.cleanup();
}, 60 * 60 * 1000);