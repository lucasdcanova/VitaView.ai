// Stripe CSP troubleshooting and fixes
export class StripeCSPHelper {
  private static stripeUrls = [
    'https://js.stripe.com',
    'https://m.stripe.network',
    'https://q.stripe.com', 
    'https://b.stripecdn.com',
    'https://r.stripe.com',
    'https://checkout.stripe.com',
    'https://connect.stripe.com'
  ];

  // Check if Stripe URLs are allowed by current CSP
  static async checkStripeCSP(): Promise<void> {
    console.group('🔍 Verificando CSP para Stripe.js');
    
    try {
      // Check if we can load a test script from Stripe
      const testScript = document.createElement('script');
      testScript.src = 'https://js.stripe.com/v3/';
      testScript.async = true;
      
      const testPromise = new Promise((resolve, reject) => {
        testScript.onload = () => {
          console.log('✅ Stripe.js carregável - CSP permite js.stripe.com');
          resolve(true);
        };
        
        testScript.onerror = (error) => {
          console.error('❌ Stripe.js bloqueado por CSP');
          reject(error);
        };
        
        // Remove after test
        setTimeout(() => {
          testScript.remove();
        }, 5000);
      });
      
      document.head.appendChild(testScript);
      
      await testPromise;
    } catch (error) {
      console.error('❌ CSP bloqueia Stripe.js:', error);
      this.suggestCSPFix();
    }
    
    console.groupEnd();
  }
  
  private static suggestCSPFix(): void {
    console.group('💡 Sugestões para corrigir CSP do Stripe');
    
    console.log('Adicione estas diretivas ao seu CSP:');
    console.log('script-src: https://js.stripe.com https://m.stripe.network');
    console.log('connect-src: https://api.stripe.com');
    console.log('frame-src: https://js.stripe.com https://hooks.stripe.com');
    
    console.log('\nCSP completo sugerido:');
    console.log(`script-src 'self' 'unsafe-inline' ${this.stripeUrls.join(' ')}`);
    
    console.groupEnd();
  }
  
  // Force reload Stripe with specific CSP bypass attempt
  static async forceLoadStripe(): Promise<boolean> {
    console.log('🔄 Tentativa forçada de carregamento do Stripe...');
    
    // Try multiple Stripe URLs in sequence
    for (const url of this.stripeUrls) {
      try {
        const success = await this.tryLoadFromUrl(url + '/v3/');
        if (success) {
          console.log(`✅ Stripe carregado com sucesso de: ${url}`);
          return true;
        }
      } catch (error) {
        console.warn(`❌ Falha ao carregar de ${url}:`, error);
        continue;
      }
    }
    
    console.error('❌ Todos os URLs do Stripe falharam');
    return false;
  }
  
  private static tryLoadFromUrl(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Timeout'));
      }, 5000);
      
      script.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Load failed'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  // Get current CSP policy
  static getCurrentCSP(): string | null {
    // Try to get from meta tag
    const metaCSP = document.querySelector('meta[http-equiv*="Content-Security-Policy"]');
    if (metaCSP) {
      return metaCSP.getAttribute('content');
    }
    
    // Try to get from response headers (limited by CORS)
    return null;
  }
  
  // Report CSP issue to our endpoint
  static async reportStripeCSPIssue(error: any): Promise<void> {
    try {
      await fetch('/api/csp-violation-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'blocked-uri': 'https://js.stripe.com',
          'violated-directive': 'script-src',
          'document-uri': window.location.href,
          'original-policy': this.getCurrentCSP() || 'unknown',
          timestamp: new Date().toISOString(),
          'user-message': 'Stripe.js blocked by CSP',
          error: error.toString()
        })
      });
    } catch (reportError) {
      console.error('Failed to report CSP issue:', reportError);
    }
  }
  
  // Initialize monitoring
  static init(): void {
    if (process.env.NODE_ENV === 'development') {
      // Auto-check CSP for Stripe on page load
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.checkStripeCSP(), 1000);
      });
      
      // Add to window for manual testing
      (window as any).StripeCSPHelper = this;
      
      console.log('🔧 StripeCSPHelper initialized');
      console.log('Available commands:');
      console.log('- StripeCSPHelper.checkStripeCSP()');
      console.log('- StripeCSPHelper.forceLoadStripe()');
      console.log('- StripeCSPHelper.getCurrentCSP()');
    }
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  StripeCSPHelper.init();
}

export default StripeCSPHelper;