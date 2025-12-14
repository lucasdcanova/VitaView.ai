interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.checkInstallation();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  private checkInstallation() {
    // Check if app is installed (PWA)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;
  }

  private setupEventListeners() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      // Banner de instalação desabilitado - pode ser ativado manualmente se necessário
      // this.showInstallBanner();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallBanner();
      this.showSuccessNotification();
    });

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for SW updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          this.showUpdateNotification();
        }
      });
    }
  }

  private async registerServiceWorker() {
    // Skip service worker registration in development to avoid conflicts
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] Service Worker registration skipped in development mode');
      // Unregister any existing service worker in development
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('[PWA] Unregistered existing service worker');
        }
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        this.swRegistration = registration;

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });

        console.log('[PWA] Service Worker registered successfully');
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  // Public methods for app installation
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      this.deferredPrompt = null;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  // Update management
  public async skipWaiting(): Promise<void> {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // Network status
  public isOnline(): boolean {
    return navigator.onLine;
  }

  // Notification helpers
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  public async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.swRegistration && 'Notification' in window && Notification.permission === 'granted') {
      await this.swRegistration.showNotification(title, {
        badge: '/assets/vitaview_logo_icon.png',
        icon: '/assets/vitaview_logo_icon.png',
        ...options
      });
    }
  }

  // Background sync
  public async requestBackgroundSync(tag: string): Promise<void> {
    if (this.swRegistration?.sync) {
      try {
        await this.swRegistration.sync.register(tag);
        console.log(`[PWA] Background sync registered: ${tag}`);
      } catch (error) {
        console.error(`[PWA] Background sync registration failed: ${tag}`, error);
      }
    }
  }

  // Private event handlers
  private handleOnline() {
    console.log('[PWA] App is back online');
    this.showNotification('Conectado', {
      body: 'Sua conexão foi restaurada. Sincronizando dados...',
      icon: '/assets/vitaview_logo_icon.png'
    });

    // Trigger background sync for offline actions
    this.requestBackgroundSync('offline-actions');
  }

  private handleOffline() {
    console.log('[PWA] App is offline');
    this.showNotification('Modo Offline', {
      body: 'Você está offline. Algumas funcionalidades podem ser limitadas.',
      icon: '/assets/vitaview_logo_icon.png'
    });
  }

  private showInstallBanner() {
    const banner = this.createInstallBanner();
    document.body.appendChild(banner);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideInstallBanner();
    }, 10000);
  }

  private hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  private createInstallBanner(): HTMLElement {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1E3A5F 0%, #448C9B 100%);
      color: white;
      padding: 12px 16px;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      animation: slideDown 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/assets/vitaview_logo_icon.png" alt="VitaView AI" style="width: 32px; height: 32px; border-radius: 6px;">
        <div>
          <div style="font-weight: 600; font-size: 14px;">Instalar VitaView AI</div>
          <div style="font-size: 12px; opacity: 0.9;">Acesso rápido às suas análises médicas</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="pwa-install-btn" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Instalar</button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.8);
          padding: 8px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        ">×</button>
      </div>
    `;

    // Add CSS animation
    if (!document.querySelector('#pwa-animations')) {
      const style = document.createElement('style');
      style.id = 'pwa-animations';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        #pwa-install-btn:hover {
          background: rgba(255,255,255,0.3) !important;
          transform: translateY(-1px);
        }
        #pwa-dismiss-btn:hover {
          color: white !important;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
      `;
      document.head.appendChild(style);
    }

    // Add event listeners
    banner.querySelector('#pwa-install-btn')?.addEventListener('click', async () => {
      const installed = await this.promptInstall();
      if (installed) {
        this.hideInstallBanner();
      }
    });

    banner.querySelector('#pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });

    return banner;
  }

  private showSuccessNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '✅ VitaView AI instalado com sucesso!';

    if (!document.querySelector('#pwa-animations')) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  private showUpdateNotification() {
    const notification = this.createUpdateNotification();
    document.body.appendChild(notification);

    // Auto-hide after 30 seconds
    setTimeout(() => {
      notification.remove();
    }, 30000);
  }

  private createUpdateNotification(): HTMLElement {
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      z-index: 10001;
      animation: slideUp 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="padding: 16px;">
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #1E3A5F 0%, #448C9B 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <span style="color: white; font-size: 18px;">🔄</span>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">Atualização Disponível</div>
            <div style="color: #6B7280; font-size: 14px; line-height: 1.4;">
              Uma nova versão do VitaView AI está disponível com melhorias e correções.
            </div>
          </div>
        </div>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button id="pwa-update-btn" style="
            flex: 1;
            background: linear-gradient(135deg, #1E3A5F 0%, #448C9B 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Atualizar Agora</button>
          <button id="pwa-update-dismiss" style="
            background: transparent;
            color: #6B7280;
            border: 1px solid #D1D5DB;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Mais Tarde</button>
        </div>
      </div>
    `;

    // Add animations if not already added
    if (!document.querySelector('#pwa-update-animations')) {
      const style = document.createElement('style');
      style.id = 'pwa-update-animations';
      style.textContent = `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #pwa-update-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
        }
        #pwa-update-dismiss:hover {
          background: #F3F4F6;
          border-color: #9CA3AF;
        }
      `;
      document.head.appendChild(style);
    }

    // Add event listeners
    notification.querySelector('#pwa-update-btn')?.addEventListener('click', () => {
      this.skipWaiting();
      window.location.reload();
    });

    notification.querySelector('#pwa-update-dismiss')?.addEventListener('click', () => {
      notification.remove();
    });

    return notification;
  }

  // Utility methods for storage management
  public async getStorageUsage(): Promise<{ used: number, quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }

  public async clearAppData(): Promise<void> {
    // Clear all caches
    await this.clearCache();

    // Clear local storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear IndexedDB (if used)
    if ('indexedDB' in window) {
      // This would need specific implementation based on your IndexedDB usage
    }

    console.log('[PWA] App data cleared');
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Expose some methods globally for debugging
(window as any).__PWA__ = {
  manager: pwaManager,
  install: () => pwaManager.promptInstall(),
  clearCache: () => pwaManager.clearCache(),
  getStorage: () => pwaManager.getStorageUsage()
};