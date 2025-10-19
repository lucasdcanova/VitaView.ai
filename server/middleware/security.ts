import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';
import { handleCSPViolation, getDynamicCSPDirectives, nonceMiddleware } from './csp-reporter';
import { dynamicCSPMiddleware, applyCSPHeader } from './dynamic-csp';
import { enhancedRateLimit } from './enhanced-rate-limit';

export function setupSecurity(app: Express) {
  // Trust proxy for proper IP detection behind reverse proxies
  app.set('trust proxy', 1);

  // CSP violation reporting
  app.use(handleCSPViolation);
  
  // Add nonce middleware for inline scripts
  app.use(nonceMiddleware);

  // Define CSP directives based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // CSP configuration
  if (isDevelopment) {
    // Development: Disable CSP enforcement, only report violations
    app.use((req: Request, res: Response, next: NextFunction) => {
      const cspPolicy = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data:",
        "script-src-elem 'self' 'unsafe-inline' https: http:",
        "style-src 'self' 'unsafe-inline' https: http:",
        "style-src-elem 'self' 'unsafe-inline' https: http:",
        "font-src 'self' https: http: data:",
        "img-src 'self' https: http: data: blob:",
        "connect-src 'self' https: http: ws: wss:",
        "frame-src 'self' https: http:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ');
      
      // Only report violations in development, don't block
      res.setHeader('Content-Security-Policy-Report-Only', 
        `${cspPolicy}; report-uri /api/csp-violation-report`);
      
      console.log('[CSP Dev] Using permissive CSP for development');
      next();
    });
  } else {
    // Production: Use strict CSP
    app.use(dynamicCSPMiddleware);
    app.use(applyCSPHeader);
  }

  // Enhanced security headers with Helmet (excluding CSP as we handle it above)
  app.use(helmet({
    contentSecurityPolicy: false, // We handle CSP manually above
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false
  }));

  // Rate limiting with different levels based on endpoint criticality
  const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
      error: 'Too many authentication attempts',
      retryAfter: 15 * 60, // seconds
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 200 : 1000, // More lenient in development
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });

  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Increased limit for file uploads
    message: {
      error: 'Too many file uploads',
      message: 'Upload limit exceeded. Please try again in an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });

  const aiAnalysisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit AI analysis requests
    message: {
      error: 'Too many analysis requests',
      message: 'AI analysis limit exceeded. Please try again in an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });

  // Apply enhanced rate limiting system
  if (process.env.NODE_ENV === 'production') {
    enhancedRateLimit.applyEnhancedRateLimiting(app);
  } else {
    // Development fallback with basic rate limiting
    app.use('/api/login', strictAuthLimiter);
    app.use('/api/register', strictAuthLimiter);
    app.use('/api/forgot-password', strictAuthLimiter);
    app.use('/api/exams/upload', uploadLimiter);
    app.use('/api/upload', uploadLimiter);
    app.use('/api/analyze', aiAnalysisLimiter);
    app.use('/api/exams/quick-summary', aiAnalysisLimiter);
    app.use('/api/', apiLimiter);
  }

  // Input sanitization and validation middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent parameter pollution
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[0];
      }
    }
    
    // Basic input validation and sanitization
    if (req.body) {
      sanitizeInput(req.body);
    }
    
    next();
  });

  // Additional security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Remove potentially revealing headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  });

  // Request size limits
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const largePayloadPaths = ['/upload', '/analyze/gemini', '/analyze/openai'];
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const isLargePath = largePayloadPaths.some(segment => req.path.includes(segment));
    const maxSize = (isLargePath || isMultipart)
      ? 50 * 1024 * 1024
      : 1024 * 1024; // 50MB for uploads/analysis, 1MB for others
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload too large',
        message: `Request size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
    
    next();
  });

  // Content-Type validation
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('content-type') || '';
      const allowedTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
      ];
      
      if (!allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: 'Content-Type not supported'
        });
      }
    }
    
    next();
  });

  // Security event logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Log suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /\.\.\//,
      /etc\/passwd/i,
      /cmd\.exe/i,
      /powershell/i
    ];
    
    const requestContent = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query,
      headers: req.headers
    });
    
    if (suspiciousPatterns.some(pattern => pattern.test(requestContent))) {
      console.warn(`[Security] Suspicious request detected from ${req.ip}:`, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
    
    next();
  });
}

// Input sanitization helper function
function sanitizeInput(obj: any): void {
  if (typeof obj !== 'object' || obj === null) return;
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic XSS prevention
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
        
      // SQL injection basic prevention (additional to parameterized queries)
      const sqlPatterns = [
        /(\s|^)(select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
        /(\s|^)(union|or|and)\s+\d+\s*=\s*\d+/gi,
        /(\s|^)(\d+\s*=\s*\d+|true|false)(\s|$)/gi
      ];
      
      sqlPatterns.forEach(pattern => {
        if (pattern.test(obj[key])) {
          console.warn(`[Security] Potential SQL injection attempt: ${obj[key]}`);
          obj[key] = obj[key].replace(pattern, '[FILTERED]');
        }
      });
    } else if (typeof obj[key] === 'object') {
      sanitizeInput(obj[key]);
    }
  }
}
