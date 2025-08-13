// Utility to safely load external scripts with CSP compliance
export class ExternalScriptLoader {
  private static loadedScripts = new Set<string>();
  
  static async loadReplitBanner(): Promise<void> {
    const scriptUrl = 'https://replit.com/public/js/replit-dev-banner.js';
    
    // Skip if not in Replit environment
    if (!this.isReplitEnvironment()) {
      console.log('[Script Loader] Not in Replit environment, skipping banner');
      return;
    }
    
    // Skip if already loaded
    if (this.loadedScripts.has(scriptUrl)) {
      console.log('[Script Loader] Replit banner already loaded');
      return;
    }
    
    try {
      await this.loadScript(scriptUrl, {
        async: true,
        crossOrigin: 'anonymous',
        timeout: 5000
      });
      
      console.log('[Script Loader] Replit banner loaded successfully');
      this.loadedScripts.add(scriptUrl);
    } catch (error) {
      console.warn('[Script Loader] Failed to load Replit banner:', error);
      // Fallback: show simple development notice
      this.showDevelopmentNotice();
    }
  }
  
  static async loadStripeJS(): Promise<any> {
    const scriptUrl = 'https://js.stripe.com/v3/';
    
    // Skip if already loaded
    if (this.loadedScripts.has(scriptUrl) && (window as any).Stripe) {
      return (window as any).Stripe;
    }
    
    try {
      await this.loadScript(scriptUrl, {
        async: true,
        crossOrigin: 'anonymous'
      });
      
      console.log('[Script Loader] Stripe.js loaded successfully');
      this.loadedScripts.add(scriptUrl);
      return (window as any).Stripe;
    } catch (error) {
      console.error('[Script Loader] Failed to load Stripe.js:', error);
      throw new Error('Stripe.js could not be loaded');
    }
  }
  
  private static loadScript(src: string, options: {
    async?: boolean;
    defer?: boolean;
    crossOrigin?: string;
    timeout?: number;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      
      if (options.async) script.async = true;
      if (options.defer) script.defer = true;
      if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
      
      // Set up timeout
      let timeoutId: NodeJS.Timeout | undefined;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          script.remove();
          reject(new Error(`Script load timeout: ${src}`));
        }, options.timeout);
      }
      
      script.onload = () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      };
      
      script.onerror = (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        script.remove();
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      // Try different append locations
      try {
        document.head.appendChild(script);
      } catch (headError) {
        try {
          document.body.appendChild(script);
        } catch (bodyError) {
          reject(new Error(`Cannot append script to DOM: ${src}`));
        }
      }
    });
  }
  
  private static isReplitEnvironment(): boolean {
    return !!(
      process.env.REPL_ID ||
      window.location.hostname.includes('replit') ||
      window.location.hostname.includes('repl.co') ||
      document.referrer.includes('replit') ||
      (window as any).REPLIT_DB_URL
    );
  }
  
  private static showDevelopmentNotice(): void {
    // Create a simple development notice if Replit banner fails
    const notice = document.createElement('div');
    notice.id = 'dev-notice';
    notice.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        font-size: 12px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        🚀 VitaView AI - Development Mode
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 2px 8px;
          margin-left: 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
        ">×</button>
      </div>
    `;
    
    document.body.appendChild(notice);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      const element = document.getElementById('dev-notice');
      if (element) element.remove();
    }, 10000);
  }
  
  // Generic script loader for any external resource
  static async loadExternalScript(src: string, options?: {
    async?: boolean;
    defer?: boolean;
    crossOrigin?: string;
    timeout?: number;
    retries?: number;
  }): Promise<void> {
    const { retries = 2, ...loadOptions } = options || {};
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        await this.loadScript(src, loadOptions);
        return;
      } catch (error) {
        console.warn(`[Script Loader] Attempt ${attempt} failed for ${src}:`, error);
        
        if (attempt === retries + 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // Check if a script is loaded
  static isScriptLoaded(src: string): boolean {
    return this.loadedScripts.has(src) || 
           !!document.querySelector(`script[src="${src}"]`);
  }
  
  // Get list of loaded scripts
  static getLoadedScripts(): string[] {
    return Array.from(this.loadedScripts);
  }
}

// Auto-load development scripts
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Load Replit banner in development
    if (process.env.NODE_ENV === 'development') {
      ExternalScriptLoader.loadReplitBanner();
    }
  });
}

export default ExternalScriptLoader;