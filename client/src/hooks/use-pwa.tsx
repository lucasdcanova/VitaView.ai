import { useState, useEffect } from 'react';
import { pwaManager } from '@/utils/pwa-manager';

interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  storageUsage?: {
    used: number;
    quota: number;
  };
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    canInstall: false,
    isOnline: navigator.onLine,
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initial state
    const updateState = () => {
      setPwaState({
        isInstalled: pwaManager.isAppInstalled(),
        canInstall: pwaManager.canInstall(),
        isOnline: pwaManager.isOnline(),
      });
    };

    // Update state immediately
    updateState();

    // Load storage usage
    pwaManager.getStorageUsage().then(storage => {
      setPwaState(prev => ({ ...prev, storageUsage: storage }));
    });

    // Set up event listeners
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
    };

    const handleBeforeInstallPrompt = () => {
      setPwaState(prev => ({ ...prev, canInstall: pwaManager.canInstall() }));
    };

    const handleAppInstalled = () => {
      setPwaState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false 
      }));
    };

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        setUpdateAvailable(true);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  // Actions
  const install = async (): Promise<boolean> => {
    const result = await pwaManager.promptInstall();
    if (result) {
      setPwaState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false 
      }));
    }
    return result;
  };

  const update = async (): Promise<void> => {
    await pwaManager.skipWaiting();
    window.location.reload();
  };

  const clearCache = async (): Promise<void> => {
    await pwaManager.clearCache();
    // Refresh storage usage
    const storage = await pwaManager.getStorageUsage();
    setPwaState(prev => ({ ...prev, storageUsage: storage }));
  };

  const clearAppData = async (): Promise<void> => {
    await pwaManager.clearAppData();
    // Refresh storage usage
    const storage = await pwaManager.getStorageUsage();
    setPwaState(prev => ({ ...prev, storageUsage: storage }));
  };

  const requestNotifications = async (): Promise<NotificationPermission> => {
    return await pwaManager.requestNotificationPermission();
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    await pwaManager.showNotification(title, options);
  };

  const requestBackgroundSync = async (tag: string): Promise<void> => {
    await pwaManager.requestBackgroundSync(tag);
  };

  return {
    ...pwaState,
    updateAvailable,
    actions: {
      install,
      update,
      clearCache,
      clearAppData,
      requestNotifications,
      showNotification,
      requestBackgroundSync,
    },
    utils: {
      formatStorageSize: (bytes: number): string => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
      },
      getStoragePercentage: (): number => {
        if (!pwaState.storageUsage || !pwaState.storageUsage.quota) return 0;
        return (pwaState.storageUsage.used / pwaState.storageUsage.quota) * 100;
      }
    }
  };
}

// PWA Install Button Component
export function PWAInstallButton({ 
  className = '',
  children,
  onInstall,
  ...props 
}: {
  className?: string;
  children?: React.ReactNode;
  onInstall?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { canInstall, actions } = usePWA();

  const handleInstall = async () => {
    const result = await actions.install();
    if (result && onInstall) {
      onInstall();
    }
  };

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 
                  text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 
                  transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      {...props}
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      {children || 'Instalar App'}
    </button>
  );
}

// PWA Status Indicator Component
export function PWAStatusIndicator({ className = '' }: { className?: string }) {
  const { isInstalled, isOnline } = usePWA();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isInstalled && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>App Instalado</span>
        </div>
      )}
      <div className={`flex items-center gap-1 text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}

// PWA Update Banner Component
export function PWAUpdateBanner() {
  const { updateAvailable, actions } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-sm">Nova versão disponível</div>
            <div className="text-xs opacity-90">Atualize para aproveitar as melhorias mais recentes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => actions.update()}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
