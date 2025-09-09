// Service Worker for Root Cause Power PWA
const CACHE_NAME = 'root-cause-power-v1.0.0';
const OFFLINE_URL = './offline.html';

// Assets to cache for offline functionality
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  './offline.html',
  // External CDN resources (cached for offline use)
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  // Icons
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg',
  './icons/apple-touch-icon-180x180.svg',
  './icons/favicon-32x32.svg'
];

// Crisis resources for offline access
const crisisResources = {
  uk: { name: 'Samaritans', number: '116123' },
  us: { name: 'Crisis Lifeline', number: '988' },
  emergency: { name: 'Emergency Services', number: '999 (UK) / 911 (US)' }
};

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Handle crisis resource requests specially
  if (event.request.url.includes('crisis') || event.request.url.includes('emergency')) {
    event.respondWith(handleCrisisRequest(event.request));
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/') || event.request.url.includes('groq.com')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If both cache and network fail, return offline page for HTML requests
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Handle navigation requests with network-first, cache fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation fetch failed, serving cached index:', error);
    // Fallback to cached index
    const cachedResponse = await caches.match('./index.html');
    return cachedResponse || caches.match(OFFLINE_URL);
  }
}

// Handle API requests with network-first, show offline message on failure
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] API request failed:', error);
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. Some features may not be available.',
        offlineSupport: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle crisis resource requests - always available offline
async function handleCrisisRequest(request) {
  // Return crisis resources even when offline
  return new Response(
    JSON.stringify({
      crisisResources,
      message: 'Crisis resources are available 24/7',
      offline: !navigator.onLine
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Background sync for important data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-journal-entries') {
    event.waitUntil(syncJournalEntries());
  }
  
  if (event.tag === 'sync-assessment-data') {
    event.waitUntil(syncAssessmentData());
  }
});

// Sync journal entries when online
async function syncJournalEntries() {
  try {
    const journalData = await getStoredJournalEntries();
    if (journalData && journalData.length > 0) {
      // Attempt to sync with server
      await syncDataWithServer('journal', journalData);
      console.log('[SW] Journal entries synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync journal entries:', error);
  }
}

// Sync assessment data when online
async function syncAssessmentData() {
  try {
    const assessmentData = await getStoredAssessmentData();
    if (assessmentData) {
      // Attempt to sync with server
      await syncDataWithServer('assessment', assessmentData);
      console.log('[SW] Assessment data synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync assessment data:', error);
  }
}

// Get stored journal entries from IndexedDB
async function getStoredJournalEntries() {
  // This would interface with IndexedDB to get stored journal entries
  // For now, returning empty array as placeholder
  return [];
}

// Get stored assessment data from IndexedDB
async function getStoredAssessmentData() {
  // This would interface with IndexedDB to get stored assessment data
  // For now, returning null as placeholder
  return null;
}

// Sync data with server when online
async function syncDataWithServer(type, data) {
  try {
    const response = await fetch(`/api/sync/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('[SW] Sync with server failed:', error);
    throw error;
  }
}

// Push notification handling for crisis alerts
self.addEventListener('push', event => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'Root Cause Power - Wellness check-in reminder',
    icon: './icons/icon-192x192.png',
    badge: './icons/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'open-app',
        title: 'Open App',
        icon: './icons/icon-192x192.png'
      },
      {
        action: 'crisis-help',
        title: 'Crisis Support',
        icon: './icons/icon-192x192.png'
      }
    ]
  };

  if (event.data) {
    const notificationData = event.data.json();
    options.body = notificationData.message || options.body;
    options.data = { ...options.data, ...notificationData };
  }

  event.waitUntil(
    self.registration.showNotification('Root Cause Power', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'crisis-help') {
    event.waitUntil(
      clients.openWindow('./index.html?crisis=true')
    );
  } else {
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  }
});

// Message handling for communication with main app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE_DATA') {
    // Store data for offline use
    storeOfflineData(event.data.data);
  }
});

// Store data for offline use
async function storeOfflineData(data) {
  try {
    const cache = await caches.open('offline-data');
    const response = new Response(JSON.stringify(data));
    await cache.put('./offline-data.json', response);
    console.log('[SW] Offline data stored successfully');
  } catch (error) {
    console.error('[SW] Failed to store offline data:', error);
  }
}