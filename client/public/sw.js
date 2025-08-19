const CACHE_VERSION = '1.2.0';
const CACHE_NAME = `vitaview-ai-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/vitaview_logo_icon.png',
  '/assets/vitaview_logo_new.png',
  '/assets/vitaview_logo_only_2k.png',
  '/assets/vitaview_ai_transparent_2k.png',
  '/vitaview-logo.svg'
];

const API_CACHE_NAME = `vitaview-api-cache-v${CACHE_VERSION}`;
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const OFFLINE_QUEUE_NAME = 'vitaview-offline-queue';
const MAX_OFFLINE_ACTIONS = 50;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external origins
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests with network-first fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(handleDefault(request));
});

// API requests - network-first with short-term caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Skip caching for sensitive endpoints
  const skipCache = [
    '/api/login',
    '/api/register',
    '/api/logout',
    '/api/upload',
    '/api/webhook'
  ].some(path => url.pathname.includes(path));

  if (skipCache) {
    return fetch(request);
  }

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for a short time
      const cache = await caches.open(API_CACHE_NAME);
      const responseClone = networkResponse.clone();
      
      // Add timestamp for cache expiration
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      await cache.put(request, modifiedResponse);
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', error);
    
    // Try cache with expiration check
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const age = Date.now() - parseInt(cachedAt || '0');
      
      if (age < API_CACHE_DURATION) {
        console.log('[SW] Serving cached API response');
        return cachedResponse;
      } else {
        // Remove expired cache entry
        await cache.delete(request);
      }
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static assets - cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache immediately, update in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

// Navigation requests - network-first with cache fallback
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving offline page');
    
    // Try to serve cached version or fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>VitaView AI - Offline</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .offline { color: #666; }
          .retry { background: #448C9B; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>VitaView AI</h1>
        <p class="offline">Você está offline. Verifique sua conexão com a internet.</p>
        <button class="retry" onclick="location.reload()">Tentar Novamente</button>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Default handler - network-first with cache fallback
async function handleDefault(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', { status: 404 });
  }
}

// Background cache update helper
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail background updates
    console.log('[SW] Background cache update failed:', error);
  }
}

// Message handler for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'exam-upload') {
      event.waitUntil(syncOfflineExams());
    }
  });
}

async function syncOfflineExams() {
  try {
    const offlineQueue = await getOfflineQueue();
    
    for (const action of offlineQueue) {
      try {
        await executeOfflineAction(action);
        await removeFromOfflineQueue(action.id);
        console.log('[SW] Synced offline action:', action.type);
      } catch (error) {
        console.error('[SW] Failed to sync offline action:', error);
        // Keep failed actions in queue for retry
      }
    }
  } catch (error) {
    console.error('[SW] Offline sync failed:', error);
  }
}

// Offline queue management
async function addToOfflineQueue(action) {
  try {
    const queue = await getOfflineQueue();
    
    // Prevent queue overflow
    if (queue.length >= MAX_OFFLINE_ACTIONS) {
      queue.shift(); // Remove oldest action
    }
    
    queue.push({
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      ...action
    });
    
    const cache = await caches.open(OFFLINE_QUEUE_NAME);
    await cache.put('offline-queue', new Response(JSON.stringify(queue)));
    
    console.log('[SW] Added action to offline queue:', action.type);
  } catch (error) {
    console.error('[SW] Failed to add to offline queue:', error);
  }
}

async function getOfflineQueue() {
  try {
    const cache = await caches.open(OFFLINE_QUEUE_NAME);
    const response = await cache.match('offline-queue');
    
    if (response) {
      const queue = await response.json();
      return Array.isArray(queue) ? queue : [];
    }
  } catch (error) {
    console.error('[SW] Failed to get offline queue:', error);
  }
  
  return [];
}

async function removeFromOfflineQueue(actionId) {
  try {
    const queue = await getOfflineQueue();
    const filteredQueue = queue.filter(action => action.id !== actionId);
    
    const cache = await caches.open(OFFLINE_QUEUE_NAME);
    await cache.put('offline-queue', new Response(JSON.stringify(filteredQueue)));
  } catch (error) {
    console.error('[SW] Failed to remove from offline queue:', error);
  }
}

async function executeOfflineAction(action) {
  switch (action.type) {
    case 'EXAM_UPLOAD':
      return await syncExamUpload(action.data);
    case 'PROFILE_UPDATE':
      return await syncProfileUpdate(action.data);
    case 'PREFERENCE_CHANGE':
      return await syncPreferenceChange(action.data);
    default:
      console.warn('[SW] Unknown offline action type:', action.type);
  }
}

async function syncExamUpload(data) {
  // Implement exam upload sync
  const response = await fetch('/api/exams/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Upload sync failed: ${response.status}`);
  }
  
  return response.json();
}

async function syncProfileUpdate(data) {
  // Implement profile update sync
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Profile sync failed: ${response.status}`);
  }
  
  return response.json();
}

async function syncPreferenceChange(data) {
  // Implement preference sync
  const response = await fetch('/api/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Preference sync failed: ${response.status}`);
  }
  
  return response.json();
}

// Enhanced message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'QUEUE_OFFLINE_ACTION') {
    event.waitUntil(addToOfflineQueue(event.data.action));
  }
  
  if (event.data && event.data.type === 'GET_CACHE_USAGE') {
    event.waitUntil(getCacheUsage().then(usage => {
      event.ports[0]?.postMessage({ type: 'CACHE_USAGE', usage });
    }));
  }
});

// Cache usage statistics
async function getCacheUsage() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    const cacheDetails = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let cacheSize = 0;
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          cacheSize += blob.size;
        }
      }
      
      cacheDetails[cacheName] = {
        entries: keys.length,
        size: cacheSize
      };
      totalSize += cacheSize;
    }
    
    return {
      totalSize,
      cacheCount: cacheNames.length,
      caches: cacheDetails
    };
  } catch (error) {
    console.error('[SW] Failed to calculate cache usage:', error);
    return { totalSize: 0, cacheCount: 0, caches: {} };
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: 'Você tem novas atualizações nos seus exames médicos.',
    icon: '/assets/vitaview_logo_icon.png',
    badge: '/assets/vitaview_logo_icon.png',
    tag: 'vitaview-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Visualizar',
        icon: '/assets/vitaview_logo_icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ],
    data: {
      url: '/dashboard'
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      Object.assign(options, data);
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('VitaView AI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  let targetUrl = '/dashboard';
  
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window
          for (let client of clientList) {
            if (client.url.includes(targetUrl) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if none exists
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'health-data-sync') {
      event.waitUntil(performPeriodicSync());
    }
  });
}

async function performPeriodicSync() {
  try {
    console.log('[SW] Performing periodic background sync');
    
    // Sync offline queue
    await syncOfflineExams();
    
    // Update critical health data cache
    await updateHealthDataCache();
    
    console.log('[SW] Periodic sync completed');
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

async function updateHealthDataCache() {
  try {
    const criticalEndpoints = [
      '/api/health-metrics/latest',
      '/api/exams/recent',
      '/api/profiles'
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint, { credentials: 'include' });
        if (response.ok) {
          const cache = await caches.open(API_CACHE_NAME);
          await cache.put(endpoint, response.clone());
          console.log('[SW] Updated cache for:', endpoint);
        }
      } catch (error) {
        console.warn('[SW] Failed to update cache for:', endpoint, error);
      }
    }
  } catch (error) {
    console.error('[SW] Health data cache update failed:', error);
  }
}

// Enhanced install event with better error handling
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(error => {
          console.error('[SW] Failed to cache some assets:', error);
          // Continue even if some assets fail
        });
      }),
      self.skipWaiting()
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      
      // Notify clients about installation
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_INSTALLED' });
        });
      });
    }).catch(error => {
      console.error('[SW] Service worker installation failed:', error);
    })
  );
});

// Enhanced activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated successfully');
      
      // Notify clients about activation and potential updates
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          // This is an update, notify clients
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
          });
        }
      });
    }).catch(error => {
      console.error('[SW] Service worker activation failed:', error);
    })
  );
});