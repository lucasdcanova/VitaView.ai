// @ts-nocheck
import { Request, Response, NextFunction } from 'express';

const REPORT_ONLY_UNSUPPORTED_DIRECTIVES = new Set([
  'upgrade-insecure-requests',
  'block-all-mixed-content',
]);

const STORAGE_ORIGIN_ENV_KEYS = [
  'AWS_S3_PUBLIC_BASE_URL',
  'AWS_CLOUDFRONT_URL',
  'AWS_CLOUDFRONT_DOMAIN',
  'ADDITIONAL_STORAGE_ORIGINS',
] as const;

const getDirectiveName = (segment: string) => {
  return segment.trim().split(/\s+/)[0]?.toLowerCase() || '';
};

export function sanitizeReportOnlyCsp(csp: string): string {
  return csp
    .split(';')
    .map(segment => segment.trim())
    .filter(Boolean)
    .filter(segment => !REPORT_ONLY_UNSUPPORTED_DIRECTIVES.has(getDirectiveName(segment)))
    .join('; ');
}

const normalizeOrigin = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
};

const getConfiguredStorageOrigins = () => {
  const bucket =
    process.env.AWS_S3_BUCKET ||
    process.env.AWS_S3_BUCKET_NAME ||
    'vitaview-sensitive-data';
  const region = process.env.AWS_REGION || 'us-east-1';
  const envOrigins = STORAGE_ORIGIN_ENV_KEYS.flatMap((key) =>
    (process.env[key] || '')
      .split(',')
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin))
  );

  const exactOrigins = [
    `https://${bucket}.s3.amazonaws.com`,
    `https://${bucket}.s3.${region}.amazonaws.com`,
    `https://${bucket}.s3-${region}.amazonaws.com`,
    `https://s3.amazonaws.com`,
    `https://s3.${region}.amazonaws.com`,
    `https://s3-${region}.amazonaws.com`,
  ];

  return [...new Set([...exactOrigins, ...envOrigins])];
};

// Known trusted domains for different services
const TRUSTED_DOMAINS = {
  stripe: [
    'https://js.stripe.com',
    'https://m.stripe.network',
    'https://q.stripe.com',
    'https://b.stripecdn.com',
    'https://r.stripe.com',
    'https://checkout.stripe.com',
    'https://connect.stripe.com'
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
    'https://fonts.gstatic.com',
    'https://r2cdn.perplexity.ai'
  ],
  apis: [
    'https://api.openai.com',
    'https://generativelanguage.googleapis.com'
  ],
  storage: getConfiguredStorageOrigins(),
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
    req.path.includes('stripe') ||
    referer.includes('stripe') ||
    isDev; // Always include Stripe in development

  const needsReplit = isReplit ||
    req.hostname.includes('replit') ||
    referer.includes('replit') ||
    req.get('host')?.includes('replit') ||
    isDev; // Always include in development for safety

  const needsAnalytics = !isDev; // Only in production

  // Build CSP based on detected needs
  let scriptSrc = ["'self'", "'unsafe-inline'"];
  let styleSrc = ["'self'", "'unsafe-inline'"]; // CSS-in-JS needs unsafe-inline
  let connectSrc = ["'self'"];
  let imgSrc = ["'self'", "data:", "blob:"];

  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
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
  connectSrc.push(...getTrustedDomains('fonts')); // Allow SW to fetch fonts
  connectSrc.push(...getTrustedDomains('storage'));
  imgSrc.push(...getTrustedDomains('storage'));

  // Store CSP directives in res.locals for use by other middleware
  const finalScriptSrc = [...new Set(scriptSrc)];
  const finalStyleSrc = [...new Set(styleSrc)];

  res.locals.cspDirectives = {
    'default-src': ["'self'"],
    'script-src': finalScriptSrc,
    'script-src-elem': finalScriptSrc, // Explicit script-src-elem
    'style-src': finalStyleSrc,
    'style-src-elem': finalStyleSrc, // Explicit style-src-elem
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

  // Debug log in development
  if (isDev) {
    console.log('[CSP Debug] Generated directives for', req.path, {
      'script-src': finalScriptSrc,
      'script-src-elem': finalScriptSrc,
      needsReplit,
      needsStripe
    });
  }

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
  const reportOnlyCspString = sanitizeReportOnlyCsp(cspString);

  if (isDev) {
    // Development: Report-only mode
    res.setHeader('Content-Security-Policy-Report-Only',
      `${reportOnlyCspString}; report-uri /api/csp-violation-report`);
  } else {
    // Production: Enforcing mode
    res.setHeader('Content-Security-Policy', cspString);
    res.setHeader('Content-Security-Policy-Report-Only',
      `${reportOnlyCspString}; report-uri /api/csp-violation-report`);
  }

  next();
}
