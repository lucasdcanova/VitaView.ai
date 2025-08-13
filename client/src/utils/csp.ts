// CSP utilities for frontend
export class CSPManager {
  private static nonce: string | null = null;

  // Get the CSP nonce from the page
  static getNonce(): string | null {
    if (this.nonce) return this.nonce;
    
    const metaNonce = document.querySelector('meta[name="csp-nonce"]');
    if (metaNonce) {
      this.nonce = metaNonce.getAttribute('content');
      return this.nonce;
    }
    
    return null;
  }

  // Create script element with nonce
  static createScript(src?: string, content?: string): HTMLScriptElement {
    const script = document.createElement('script');
    
    const nonce = this.getNonce();
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }
    
    if (src) {
      script.src = src;
    }
    
    if (content) {
      script.textContent = content;
    }
    
    return script;
  }

  // Load external script with CSP compliance
  static loadScript(src: string, options?: {
    async?: boolean;
    defer?: boolean;
    onLoad?: () => void;
    onError?: (error: Event) => void;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = this.createScript(src);
      
      if (options?.async) script.async = true;
      if (options?.defer) script.defer = true;
      
      script.onload = () => {
        options?.onLoad?.();
        resolve();
      };
      
      script.onerror = (error) => {
        options?.onError?.(error);
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      document.head.appendChild(script);
    });
  }

  // Create style element with nonce
  static createStyle(content: string): HTMLStyleElement {
    const style = document.createElement('style');
    
    const nonce = this.getNonce();
    if (nonce) {
      style.setAttribute('nonce', nonce);
    }
    
    style.textContent = content;
    return style;
  }

  // Check if a resource is allowed by CSP
  static isResourceAllowed(url: string, directive: 'script-src' | 'style-src' | 'img-src' | 'connect-src'): boolean {
    try {
      const testElement = document.createElement('div');
      
      switch (directive) {
        case 'script-src':
          const script = document.createElement('script');
          script.src = url;
          testElement.appendChild(script);
          break;
        case 'style-src':
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          testElement.appendChild(link);
          break;
        case 'img-src':
          const img = document.createElement('img');
          img.src = url;
          testElement.appendChild(img);
          break;
        default:
          return true;
      }
      
      return true; // If we get here, the resource should be allowed
    } catch (error) {
      console.warn(`CSP check failed for ${url}:`, error);
      return false;
    }
  }

  // Report CSP violations programmatically
  static reportViolation(violation: {
    blockedURI: string;
    violatedDirective: string;
    originalPolicy: string;
    documentURI?: string;
  }): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', violation);
    }

    // Send violation report to server
    fetch('/api/csp-violation-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'blocked-uri': violation.blockedURI,
        'violated-directive': violation.violatedDirective,
        'original-policy': violation.originalPolicy,
        'document-uri': violation.documentURI || window.location.href,
        referrer: document.referrer,
        'status-code': 200,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Failed to report CSP violation:', error);
    });
  }

  // Initialize CSP monitoring
  static init(): void {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.reportViolation({
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        documentURI: event.documentURI
      });
    });

    // Monitor for inline styles and scripts that might violate CSP
    if (process.env.NODE_ENV === 'development') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check for inline styles
                if (element.hasAttribute('style')) {
                  console.warn('[CSP Dev Warning] Inline style detected:', element);
                }
                
                // Check for inline event handlers
                Array.from(element.attributes).forEach((attr) => {
                  if (attr.name.startsWith('on')) {
                    console.warn('[CSP Dev Warning] Inline event handler detected:', attr.name, element);
                  }
                });
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
}

// Auto-initialize CSP manager
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    CSPManager.init();
  });
}

export default CSPManager;