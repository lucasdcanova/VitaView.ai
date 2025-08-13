import { Request, Response, NextFunction } from 'express';

// Known trusted domains for different services
const TRUSTED_DOMAINS = {
  stripe: [
    'https://js.stripe.com',
    'https://m.stripe.network',
    'https://q.stripe.com',
    'https://b.stripecdn.com',
    'https://r.stripe.com'
  ],
  replit: [
    'https://replit.com',
    'https://static.replit.com'
  ],
  analytics: [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
    'https://analytics.google.com'
  ],
  fonts: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],
  apis: [
    'https://api.openai.com',
    'https://generativelanguage.googleapis.com'
  ]
};

// Get all trusted domains for a specific directive
export function getTrustedDomains(service?: keyof typeof TRUSTED_DOMAINS): string[] {
  if (service) {
    return TRUSTED_DOMAINS[service] || [];
  }
  
  // Return all domains if no specific service is requested
  return Object.values(TRUSTED_DOMAINS).flat();
}

// Create CSP directive with trusted domains
export function createCSPDirective(
  directive: string, 
  baseSources: string[], 
  services: (keyof typeof TRUSTED_DOMAINS)[] = []
): string[] {
  const trustedDomains = services.flatMap(service => getTrustedDomains(service));
  return [...new Set([...baseSources, ...trustedDomains])];
}

// Dynamic CSP middleware that adapts based on detected services
export function dynamicCSPMiddleware(req: Request, res: Response, next: NextFunction) {
  const isDev = process.env.NODE_ENV === 'development';
  const isReplit = process.env.REPL_ID !== undefined;
  const userAgent = req.get('user-agent') || '';
  const referer = req.get('referer') || '';
  
  // Detect which services are being used
  const needsStripe = req.path.includes('payment') || 
                     req.path.includes('subscription') || 
                     referer.includes('stripe');
  
  const needsReplit = isReplit || 
                     req.hostname.includes('replit') || 
                     referer.includes('replit');
  
  const needsAnalytics = !isDev; // Only in production
  
  // Build CSP based on detected needs
  let scriptSrc = ["'self'"];
  let styleSrc = ["'self'", "'unsafe-inline'"]; // CSS-in-JS needs unsafe-inline
  let connectSrc = ["'self'"];
  let imgSrc = ["'self'", "data:", "blob:"];
  
  if (isDev) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    scriptSrc.push("http://localhost:*", "https://localhost:*");
    connectSrc.push("http://localhost:*", "https://localhost:*", "ws://localhost:*", "wss://localhost:*");
    imgSrc.push("https:");
  }
  
  if (needsStripe) {
    scriptSrc.push(...getTrustedDomains('stripe'));
    styleSrc.push(...getTrustedDomains('stripe'));
    connectSrc.push(...getTrustedDomains('stripe'));
  }
  
  if (needsReplit) {
    scriptSrc.push(...getTrustedDomains('replit'));
  }
  
  if (needsAnalytics) {
    scriptSrc.push(...getTrustedDomains('analytics'));
    connectSrc.push(...getTrustedDomains('analytics'));
    imgSrc.push(...getTrustedDomains('analytics'));
  }
  
  // Always allow fonts and APIs
  styleSrc.push(...getTrustedDomains('fonts'));
  connectSrc.push(...getTrustedDomains('apis'));
  
  // Store CSP directives in res.locals for use by other middleware
  res.locals.cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [...new Set(scriptSrc)],
    'script-src-elem': [...new Set(scriptSrc)],
    'style-src': [...new Set(styleSrc)],
    'style-src-elem': [...new Set(styleSrc)],
    'font-src': ["'self'", ...getTrustedDomains('fonts'), "data:"],
    'img-src': [...new Set(imgSrc)],
    'connect-src': [...new Set(connectSrc)],
    'frame-src': ["'self'", ...getTrustedDomains('stripe')],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(isDev ? {} : {
      'upgrade-insecure-requests': [],
      'block-all-mixed-content': []
    })
  };
  
  next();
}

// Format CSP directives into header string
export function formatCSPHeader(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        return `${directive} ${sources.join(' ')}`;
      } else if (sources.length === 0) {
        return directive; // For directives like upgrade-insecure-requests
      }
      return null;
    })
    .filter(Boolean)
    .join('; ');
}

// Apply CSP header based on environment
export function applyCSPHeader(req: Request, res: Response, next: NextFunction) {
  const isDev = process.env.NODE_ENV === 'development';
  const directives = res.locals.cspDirectives;
  
  if (!directives) {
    return next();
  }
  
  const cspString = formatCSPHeader(directives);
  
  if (isDev) {
    // Development: Report-only mode
    res.setHeader('Content-Security-Policy-Report-Only', 
      `${cspString}; report-uri /api/csp-violation-report`);
  } else {
    // Production: Enforcing mode
    res.setHeader('Content-Security-Policy', cspString);
    res.setHeader('Content-Security-Policy-Report-Only', 
      `${cspString}; report-uri /api/csp-violation-report`);
  }
  
  next();
}