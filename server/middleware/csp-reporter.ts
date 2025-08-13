import { Request, Response, NextFunction } from 'express';

// CSP violation handler
export function handleCSPViolation(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/csp-violation-report') {
    const violation = req.body;
    
    // Log CSP violations for monitoring
    console.warn('[CSP Violation]', {
      timestamp: new Date().toISOString(),
      violatedDirective: violation['violated-directive'],
      blockedURI: violation['blocked-uri'],
      documentURI: violation['document-uri'],
      originalPolicy: violation['original-policy'],
      referrer: violation.referrer,
      statusCode: violation['status-code'],
      userAgent: req.get('user-agent'),
      ip: req.ip
    });

    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external monitoring service
      // await sendToMonitoringService(violation);
    }

    res.status(204).end();
    return;
  }
  
  next();
}

// Dynamic CSP configuration based on environment and request
export function getDynamicCSPDirectives(req: Request) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isReplit = process.env.REPL_ID !== undefined;
  const host = req.get('host') || '';
  const protocol = req.protocol;
  
  // Base directives that are always applied
  const baseDirectives = {
    defaultSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  };

  // Development-specific directives (more permissive)
  if (isDevelopment || isReplit) {
    return {
      ...baseDirectives,
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS and hot reload
        "https://fonts.googleapis.com",
        "https://cdn.tailwindcss.com",
        `${protocol}://${host}`,
        "http://localhost:*",
        "https://localhost:*"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Required for Vite dev server
        "https://replit.com",
        "https://js.stripe.com",
        `${protocol}://${host}`,
        "http://localhost:*",
        "https://localhost:*"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:"
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://generativelanguage.googleapis.com",
        "https://api.stripe.com",
        "http://localhost:*",
        "https://localhost:*",
        "ws://localhost:*",
        "wss://localhost:*",
        `${protocol}://${host}`
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ]
    };
  }

  // Production directives (strict)
  return {
    ...baseDirectives,
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Still needed for some CSS-in-JS
      "https://fonts.googleapis.com"
    ],
    scriptSrc: [
      "'self'",
      "https://js.stripe.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https://vitaview.ai",
      "https://*.vitaview.ai",
      "https://www.google-analytics.com"
    ],
    connectSrc: [
      "'self'",
      "https://api.openai.com",
      "https://generativelanguage.googleapis.com",
      "https://api.stripe.com",
      "https://www.google-analytics.com",
      "https://region1.google-analytics.com"
    ],
    frameSrc: [
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com"
    ],
    upgradeInsecureRequests: [],
    blockAllMixedContent: []
  };
}

// Nonce generator for scripts (more secure than unsafe-inline)
export function generateNonce(): string {
  return Buffer.from(Math.random().toString()).toString('base64');
}

// Middleware to add nonce to res.locals for templates
export function nonceMiddleware(req: Request, res: Response, next: NextFunction) {
  res.locals.nonce = generateNonce();
  next();
}