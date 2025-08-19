import compression from 'compression';
import { Request, Response, NextFunction, Express } from 'express';
import { createGzip, createBrotliCompress } from 'zlib';

interface CompressionOptions {
  threshold: number;
  level: number;
  chunkSize: number;
  windowBits: number;
  memLevel: number;
  strategy: number;
}

class AdvancedCompression {
  private readonly defaultOptions: CompressionOptions = {
    threshold: 1024, // Only compress files larger than 1KB
    level: 6, // Balanced compression level
    chunkSize: 16384, // 16KB chunks
    windowBits: 15,
    memLevel: 8,
    strategy: 0
  };

  // Smart compression middleware that chooses the best algorithm
  createSmartCompressionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const acceptEncoding = req.headers['accept-encoding'] || '';
      
      // Check client capabilities
      const supportsBrotli = /br/.test(acceptEncoding);
      const supportsGzip = /gzip/.test(acceptEncoding);
      const supportsDeflate = /deflate/.test(acceptEncoding);
      
      if (supportsBrotli && this.shouldUseBrotli(req)) {
        this.applyBrotliCompression(req, res, next);
      } else if (supportsGzip) {
        this.applyGzipCompression(req, res, next);
      } else if (supportsDeflate) {
        this.applyDeflateCompression(req, res, next);
      } else {
        next();
      }
    };
  }

  // Standard compression middleware with optimized settings
  createOptimizedCompressionMiddleware() {
    return compression({
      // Only compress responses that are larger than 1KB
      threshold: this.defaultOptions.threshold,
      
      // Set compression level (1-9, where 6 is balanced)
      level: this.defaultOptions.level,
      
      // Filter function to determine what to compress
      filter: (req: Request, res: Response) => {
        // Don't compress if client doesn't support it
        if (!req.headers['accept-encoding']) {
          return false;
        }
        
        // Don't compress already compressed files
        const contentType = res.get('content-type') || '';
        const compressedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/', 'audio/', 'application/zip', 'application/gzip',
          'application/x-rar-compressed', 'application/x-7z-compressed'
        ];
        
        if (compressedTypes.some(type => contentType.includes(type))) {
          return false;
        }
        
        // Compress text-based content
        const compressibleTypes = [
          'text/', 'application/json', 'application/javascript',
          'application/xml', 'application/rss+xml', 'application/atom+xml',
          'image/svg+xml'
        ];
        
        return compressibleTypes.some(type => contentType.includes(type));
      }
    });
  }

  // Content-aware compression levels
  createContentAwareCompressionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(body: any) {
        const contentType = this.get('content-type') || '';
        const compressionLevel = this.getCompressionLevel(contentType, body);
        
        // Set appropriate compression level
        if (compressionLevel > 0) {
          this.set('vary', 'Accept-Encoding');
          this.removeHeader('content-length');
          
          // Apply compression based on content type
          if (contentType.includes('application/json')) {
            this.applyJsonCompression(body, compressionLevel);
          } else if (contentType.includes('text/html')) {
            this.applyHtmlCompression(body, compressionLevel);
          } else if (contentType.includes('text/css') || contentType.includes('application/javascript')) {
            this.applyAssetCompression(body, compressionLevel);
          }
        }
        
        return originalSend.call(this, body);
      } as any;
      
      res.json = function(obj: any) {
        const compressionLevel = this.getCompressionLevel('application/json', obj);
        
        if (compressionLevel > 0) {
          this.set('vary', 'Accept-Encoding');
          this.removeHeader('content-length');
          this.applyJsonCompression(obj, compressionLevel);
        }
        
        return originalJson.call(this, obj);
      } as any;
      
      // Add compression level method to response
      (res as any).getCompressionLevel = this.getCompressionLevel.bind(this);
      (res as any).applyJsonCompression = this.applyJsonCompression.bind(this);
      (res as any).applyHtmlCompression = this.applyHtmlCompression.bind(this);
      (res as any).applyAssetCompression = this.applyAssetCompression.bind(this);
      
      next();
    };
  }

  private shouldUseBrotli(req: Request): boolean {
    // Use Brotli for static assets and API responses
    const path = req.path;
    const isStaticAsset = /\.(css|js|html|svg|json)$/.test(path);
    const isApiResponse = path.startsWith('/api/');
    
    return isStaticAsset || isApiResponse;
  }

  private applyBrotliCompression(req: Request, res: Response, next: NextFunction) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (!/br/.test(acceptEncoding)) {
      return next();
    }
    
    res.setHeader('Content-Encoding', 'br');
    res.setHeader('Vary', 'Accept-Encoding');
    
    const brotli = createBrotliCompress({
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 6,
        [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: res.get('content-length')
      }
    });
    
    brotli.on('data', (chunk) => {
      res.write(chunk);
    });
    
    brotli.on('end', () => {
      res.end();
    });
    
    const originalWrite = res.write;
    const originalEnd = res.end;
    
    res.write = function(chunk: any) {
      brotli.write(chunk);
      return true;
    } as any;
    
    res.end = function(chunk?: any) {
      if (chunk) {
        brotli.write(chunk);
      }
      brotli.end();
    } as any;
    
    next();
  }

  private applyGzipCompression(req: Request, res: Response, next: NextFunction) {
    const gzip = compression({
      level: this.getGzipLevel(req),
      threshold: this.defaultOptions.threshold,
      filter: this.createGzipFilter()
    });
    
    gzip(req, res, next);
  }

  private applyDeflateCompression(req: Request, res: Response, next: NextFunction) {
    const deflate = compression({
      level: this.defaultOptions.level,
      threshold: this.defaultOptions.threshold,
      filter: (req: Request, res: Response) => {
        const contentType = res.get('content-type') || '';
        return /text|json|javascript|xml/.test(contentType);
      }
    });
    
    deflate(req, res, next);
  }

  private getGzipLevel(req: Request): number {
    const path = req.path;
    
    // High compression for API responses
    if (path.startsWith('/api/')) {
      return 8;
    }
    
    // Medium compression for HTML/CSS/JS
    if (/\.(html|css|js)$/.test(path)) {
      return 6;
    }
    
    // Lower compression for images and other assets
    if (/\.(svg|xml|json)$/.test(path)) {
      return 4;
    }
    
    return this.defaultOptions.level;
  }

  private createGzipFilter() {
    return (req: Request, res: Response) => {
      const contentType = res.get('content-type') || '';
      
      // Skip pre-compressed files
      if (/\.(gz|zip|rar|7z|bz2)$/.test(req.path)) {
        return false;
      }
      
      // Skip binary files
      if (/image\/(?!svg)/.test(contentType)) {
        return false;
      }
      
      // Compress text-based content
      return /text|json|javascript|xml|svg/.test(contentType);
    };
  }

  private getCompressionLevel(contentType: string, content: any): number {
    // JSON API responses - high compression
    if (contentType.includes('application/json')) {
      const contentSize = JSON.stringify(content).length;
      if (contentSize > 10000) return 8; // High compression for large JSON
      if (contentSize > 1000) return 6;  // Medium compression
      return 4; // Light compression for small responses
    }
    
    // HTML content - medium compression
    if (contentType.includes('text/html')) {
      return 6;
    }
    
    // CSS/JS assets - high compression
    if (contentType.includes('text/css') || contentType.includes('application/javascript')) {
      return 8;
    }
    
    // SVG and XML - medium compression
    if (contentType.includes('xml') || contentType.includes('svg')) {
      return 6;
    }
    
    return this.defaultOptions.level;
  }

  private applyJsonCompression(data: any, level: number) {
    // Remove unnecessary whitespace from JSON
    if (typeof data === 'object') {
      return JSON.stringify(data); // Already minified
    }
    return data;
  }

  private applyHtmlCompression(html: string, level: number) {
    if (typeof html !== 'string') return html;
    
    // Basic HTML minification
    return html
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+>/g, '>') // Remove whitespace before closing tags
      .trim();
  }

  private applyAssetCompression(content: string, level: number) {
    if (typeof content !== 'string') return content;
    
    // Basic minification for CSS/JS
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }

  // Apply compression middleware to Express app
  applyCompression(app: Express) {
    // Apply smart compression that chooses the best algorithm
    app.use(this.createSmartCompressionMiddleware());
    
    // Fallback to optimized standard compression
    app.use(this.createOptimizedCompressionMiddleware());
    
    // Add content-aware compression for dynamic responses
    app.use(this.createContentAwareCompressionMiddleware());
    
    // Static file compression headers
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Set appropriate cache headers for compressed content
      if (req.headers['accept-encoding']) {
        res.setHeader('Vary', 'Accept-Encoding');
      }
      
      // Add compression info to response headers in development
      if (process.env.NODE_ENV === 'development') {
        const originalSend = res.send;
        res.send = function(body: any) {
          const originalSize = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body || '', 'utf8');
          this.setHeader('X-Original-Size', originalSize.toString());
          return originalSend.call(this, body);
        } as any;
      }
      
      next();
    });
  }
}

export const advancedCompression = new AdvancedCompression();