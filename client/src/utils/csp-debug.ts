// CSP debugging utilities - only for development
export class CSPDebugger {
  private static violations: any[] = [];
  
  static init() {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log('[CSP Debug] CSP debugging enabled');
    
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        timestamp: new Date().toISOString(),
        documentURI: event.documentURI
      };
      
      this.violations.push(violation);
      
      console.group(`🚫 CSP Violation #${this.violations.length}`);
      console.error('Blocked URI:', event.blockedURI);
      console.error('Violated Directive:', event.violatedDirective);
      console.error('Document URI:', event.documentURI);
      console.error('Original Policy:', event.originalPolicy);
      console.groupEnd();
      
      // Suggest fixes
      this.suggestFix(violation);
    });
    
    // Check for common problematic patterns
    this.checkCommonIssues();
  }
  
  static suggestFix(violation: any) {
    const { blockedURI, violatedDirective } = violation;
    
    console.group('💡 Suggested Fix');
    
    if (blockedURI.includes('replit.com')) {
      console.log('Add to CSP: script-src https://replit.com https://static.replit.com');
    }
    
    if (blockedURI.includes('stripe')) {
      console.log('Add to CSP: script-src https://js.stripe.com https://m.stripe.network');
    }
    
    if (blockedURI.includes('fonts.googleapis.com')) {
      console.log('Add to CSP: style-src https://fonts.googleapis.com');
    }
    
    if (blockedURI.includes('fonts.gstatic.com')) {
      console.log('Add to CSP: font-src https://fonts.gstatic.com');
    }
    
    if (violatedDirective.includes('unsafe-inline')) {
      console.log('Consider using nonces instead of unsafe-inline');
    }
    
    console.groupEnd();
  }
  
  static checkCommonIssues() {
    // Check for inline styles
    const inlineStyles = document.querySelectorAll('[style]');
    if (inlineStyles.length > 0) {
      console.warn(`[CSP Debug] Found ${inlineStyles.length} inline styles that might violate CSP`);
    }
    
    // Check for inline event handlers
    const elements = document.querySelectorAll('*');
    let inlineHandlers = 0;
    elements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          inlineHandlers++;
        }
      });
    });
    
    if (inlineHandlers > 0) {
      console.warn(`[CSP Debug] Found ${inlineHandlers} inline event handlers that might violate CSP`);
    }
  }
  
  static getViolations() {
    return this.violations;
  }
  
  static clearViolations() {
    this.violations = [];
  }
  
  static testResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
    console.log(`[CSP Debug] Testing ${type}: ${url}`);
    
    const testElement = document.createElement('div');
    testElement.style.display = 'none';
    
    let element: HTMLElement;
    
    switch (type) {
      case 'script':
        element = document.createElement('script');
        (element as HTMLScriptElement).src = url;
        break;
      case 'style':
        element = document.createElement('link');
        (element as HTMLLinkElement).rel = 'stylesheet';
        (element as HTMLLinkElement).href = url;
        break;
      case 'image':
        element = document.createElement('img');
        (element as HTMLImageElement).src = url;
        break;
    }
    
    element.onload = () => {
      console.log(`✅ [CSP Debug] ${type} loaded successfully: ${url}`);
      testElement.remove();
    };
    
    element.onerror = (error) => {
      console.error(`❌ [CSP Debug] ${type} failed to load: ${url}`, error);
      testElement.remove();
    };
    
    testElement.appendChild(element);
    document.body.appendChild(testElement);
  }
  
  static showCurrentPolicy() {
    const metaCSP = document.querySelector('meta[http-equiv*="Content-Security-Policy"]');
    if (metaCSP) {
      console.log('[CSP Debug] Current CSP from meta tag:', metaCSP.getAttribute('content'));
    }
    
    // Try to get CSP from response headers (if available)
    fetch(window.location.href, { method: 'HEAD' })
      .then(response => {
        const csp = response.headers.get('content-security-policy');
        const cspReportOnly = response.headers.get('content-security-policy-report-only');
        
        if (csp) {
          console.log('[CSP Debug] Current CSP from headers:', csp);
        }
        if (cspReportOnly) {
          console.log('[CSP Debug] CSP Report-Only from headers:', cspReportOnly);
        }
      })
      .catch(error => {
        console.log('[CSP Debug] Could not fetch CSP from headers:', error);
      });
  }
}

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  document.addEventListener('DOMContentLoaded', () => {
    CSPDebugger.init();
    
    // Add debug utilities to window for manual testing
    (window as any).CSPDebugger = CSPDebugger;
    
    console.log('[CSP Debug] Available commands:');
    console.log('- CSPDebugger.getViolations() - Get all violations');
    console.log('- CSPDebugger.testResource(url, type) - Test if resource loads');
    console.log('- CSPDebugger.showCurrentPolicy() - Show current CSP');
    console.log('- CSPDebugger.clearViolations() - Clear violation log');
  });
}

export default CSPDebugger;