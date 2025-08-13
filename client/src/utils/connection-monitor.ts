// Connection monitoring and health check utilities
export class ConnectionMonitor {
  private static healthCheckInterval: NodeJS.Timeout | null = null;
  private static isServerOnline = false;
  private static baseURL = '';
  
  static init(baseURL: string = '') {
    this.baseURL = baseURL || window.location.origin;
    
    // Start health monitoring
    this.startHealthCheck();
    
    // Monitor WebSocket connections
    this.monitorWebSocket();
    
    // Add to window for debugging
    if (process.env.NODE_ENV === 'development') {
      (window as any).ConnectionMonitor = this;
      console.log('🔗 ConnectionMonitor initialized');
    }
  }
  
  private static startHealthCheck(): void {
    // Initial check
    this.checkServerHealth();
    
    // Periodic checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkServerHealth();
    }, 30000);
  }
  
  private static async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const isOnline = response.ok;
      
      if (isOnline !== this.isServerOnline) {
        this.isServerOnline = isOnline;
        this.onServerStatusChange(isOnline);
      }
      
      return isOnline;
    } catch (error) {
      if (this.isServerOnline) {
        this.isServerOnline = false;
        this.onServerStatusChange(false);
      }
      
      console.warn('🔗 Server health check failed:', error);
      return false;
    }
  }
  
  private static onServerStatusChange(isOnline: boolean): void {
    if (isOnline) {
      console.log('✅ Server is online');
      this.hideOfflineNotice();
    } else {
      console.warn('❌ Server appears to be offline');
      this.showOfflineNotice();
    }
  }
  
  private static showOfflineNotice(): void {
    // Remove existing notice
    const existing = document.getElementById('offline-notice');
    if (existing) existing.remove();
    
    const notice = document.createElement('div');
    notice.id = 'offline-notice';
    notice.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ef4444;
        color: white;
        padding: 8px 16px;
        font-size: 14px;
        text-align: center;
        z-index: 10001;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        🔌 Servidor offline - Algumas funcionalidades podem não funcionar
        <button onclick="location.reload()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 4px 12px;
          margin-left: 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Recarregar</button>
      </div>
    `;
    
    document.body.appendChild(notice);
  }
  
  private static hideOfflineNotice(): void {
    const notice = document.getElementById('offline-notice');
    if (notice) notice.remove();
  }
  
  private static monitorWebSocket(): void {
    // Monitor failed WebSocket connections
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = class extends WebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        try {
          super(url, protocols);
          console.log('🔌 WebSocket connecting to:', url);
        } catch (error) {
          console.error('🔌 WebSocket connection failed:', url, error);
          
          // Show connection issue notice
          ConnectionMonitor.showConnectionIssue('WebSocket connection failed');
          throw error;
        }
        
        this.addEventListener('error', (event) => {
          console.error('🔌 WebSocket error:', event);
          ConnectionMonitor.showConnectionIssue('WebSocket error occurred');
        });
        
        this.addEventListener('close', (event) => {
          if (!event.wasClean) {
            console.warn('🔌 WebSocket closed unexpectedly:', event.code, event.reason);
            ConnectionMonitor.showConnectionIssue('WebSocket connection lost');
          }
        });
      }
    } as any;
    
    // Restore original WebSocket for debugging
    if (process.env.NODE_ENV === 'development') {
      (window as any).OriginalWebSocket = originalWebSocket;
    }
  }
  
  private static showConnectionIssue(message: string): void {
    console.warn('🔗 Connection issue:', message);
    
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;
    
    // Show temporary notice
    const notice = document.createElement('div');
    notice.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #f59e0b;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        max-width: 300px;
        z-index: 10002;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        ⚠️ ${message}
      </div>
    `;
    
    document.body.appendChild(notice);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notice.remove();
    }, 5000);
  }
  
  // Manual health check
  static async manualHealthCheck(): Promise<boolean> {
    console.log('🔗 Manual health check...');
    return await this.checkServerHealth();
  }
  
  // Get server status
  static getServerStatus(): { isOnline: boolean; baseURL: string } {
    return {
      isOnline: this.isServerOnline,
      baseURL: this.baseURL
    };
  }
  
  // Test specific endpoint
  static async testEndpoint(path: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const success = response.ok;
      console.log(`🔗 Endpoint ${path}: ${success ? '✅ OK' : '❌ Failed'} (${response.status})`);
      
      return success;
    } catch (error) {
      console.error(`🔗 Endpoint ${path}: ❌ Error:`, error);
      return false;
    }
  }
  
  // Test common endpoints
  static async testCommonEndpoints(): Promise<Record<string, boolean>> {
    const endpoints = [
      '/api/health',
      '/api/user',
      '/api/exams',
      '/api/notifications',
      '/api/profiles'
    ];
    
    const results: Record<string, boolean> = {};
    
    console.group('🔗 Testing common endpoints:');
    
    for (const endpoint of endpoints) {
      results[endpoint] = await this.testEndpoint(endpoint);
    }
    
    console.groupEnd();
    return results;
  }
  
  // Clean up
  static cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.hideOfflineNotice();
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ConnectionMonitor.init();
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    ConnectionMonitor.cleanup();
  });
}

export default ConnectionMonitor;