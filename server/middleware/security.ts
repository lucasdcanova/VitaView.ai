import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';

export function setupSecurity(app: Express) {
  // Trust proxy for proper IP detection behind reverse proxies
  app.set('trust proxy', 1);

  // Enhanced security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://cdn.tailwindcss.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
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

  // Apply rate limiters to specific endpoints
  app.use('/api/login', strictAuthLimiter);
  app.use('/api/register', strictAuthLimiter);
  app.use('/api/forgot-password', strictAuthLimiter);
  app.use('/api/exams/upload', uploadLimiter);
  app.use('/api/upload', uploadLimiter);
  app.use('/api/analyze', aiAnalysisLimiter);
  app.use('/api/exams/quick-summary', aiAnalysisLimiter);
  app.use('/api/', apiLimiter);

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
    const maxSize = req.path.includes('/upload') ? 50 * 1024 * 1024 : 1024 * 1024; // 50MB for uploads, 1MB for others
    
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