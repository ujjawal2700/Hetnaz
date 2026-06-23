// Firebase Cloud Messaging Service Worker
// This handles background push notifications

console.log('[FCM-SW] 🚀 Firebase Messaging Service Worker loaded');

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('[FCM-SW] 📦 Firebase scripts imported');

// Firebase configuration
// NOTE: These should match your .env variables
const firebaseConfig = {
    apiKey: "AIzaSyDZU9nQpOU6FyurlgqwOxEUmWkflhi6PP8",
    authDomain: "datingapp-f035b.firebaseapp.com",
    projectId: "datingapp-f035b",
    storageBucket: "datingapp-f035b.firebasestorage.app",
    messagingSenderId: "895077165542",
    appId: "1:895077165542:web:c88c17e136c93c760d4e27"
};

console.log('[FCM-SW] 📋 Firebase Config:', {
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId ? 'Present' : 'Missing'
});

try {
    // Initialize Firebase
    console.log('[FCM-SW] 🔧 Initializing Firebase...');
    firebase.initializeApp(firebaseConfig);
    console.log('[FCM-SW] ✅ Firebase initialized successfully');

    // Get messaging instance
    const messaging = firebase.messaging();
    console.log('[FCM-SW] ✅ Messaging instance created');

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
        console.log('[FCM-SW] 📨 === BACKGROUND MESSAGE RECEIVED ===');
        console.log('[FCM-SW] 📦 Payload:', payload);
        console.log('[FCM-SW] 📋 Notification:', payload.notification);
        console.log('[FCM-SW] 📋 Data:', payload.data);

        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
            body: payload.notification?.body || 'You have a new notification',
            icon: payload.notification?.icon || '/DilMate.png',
            badge: '/badge-72x72.png',
            tag: payload.data?.chatId || 'default',
            data: payload.data,
            requireInteraction: false,
            actions: [
                { action: 'open', title: 'Open' },
                { action: 'close', title: 'Close' }
            ]
        };

        console.log('[FCM-SW] 🔔 Showing notification:', {
            title: notificationTitle,
            options: notificationOptions
        });

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log('[FCM-SW] ✅ Background message handler registered');
} catch (error) {
    console.error('[FCM-SW] ❌ Firebase initialization error:', error);
    console.error('[FCM-SW] ❌ Error details:', {
        message: error.message,
        stack: error.stack
    });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM-SW] 👆 === NOTIFICATION CLICKED ===');
    console.log('[FCM-SW] 🎬 Action:', event.action);
    console.log('[FCM-SW] 📋 Notification data:', event.notification.data);

    event.notification.close();

    if (event.action === 'close') {
        console.log('[FCM-SW] ❌ User closed notification');
        return;
    }

    // Handle opening the app
    const urlToOpen = event.notification.data?.url || '/';
    console.log('[FCM-SW] 🔗 Opening URL:', urlToOpen);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            console.log('[FCM-SW] 🔍 Found clients:', clientList.length);

            // Check if there is already a window/tab open
            for (const client of clientList) {
                console.log('[FCM-SW] 👁️ Checking client:', client.url);
                if (client.url === urlToOpen && 'focus' in client) {
                    console.log('[FCM-SW] ✅ Focusing existing client');
                    return client.focus();
                }
            }

            // If not, open new window
            if (clients.openWindow) {
                console.log('[FCM-SW] 🆕 Opening new window');
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

console.log('[FCM-SW] ✅ Service Worker setup complete');
