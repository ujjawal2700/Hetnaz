/**
 * Firebase Cloud Messaging Service (OPTIMIZED - minimal logging)
 */

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let messaging = null;
let initialized = false;

// Initialize Firebase Admin ONCE on first import
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH not set');
    }

    const fullPath = path.resolve(serviceAccountPath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('Firebase service account file not found');
    }

    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    // Check if already initialized (prevents duplicate init)
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
    }

    messaging = admin.messaging();
    initialized = true;
    console.log('[FCM] ✅ Firebase initialized');

} catch (error) {
    console.error('[FCM] ❌ Init error:', error.message);
    initialized = false;
}

/**
 * Send notification to a single device (with 5s timeout)
 */
export const sendNotification = async (fcmToken, notification, data = {}) => {
    if (!initialized || !messaging || !fcmToken) {
        return { success: false, error: 'Not ready' };
    }

    try {
        const message = {
            token: fcmToken,
            notification: {
                title: notification.title || 'Notification',
                body: notification.body || '',
            },
            data: { ...data, timestamp: new Date().toISOString() },
            android: { priority: 'high', notification: { sound: 'default' } },
            webpush: { notification: { icon: '/DilMate.png' } }
        };

        const sendPromise = messaging.send(message);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('FCM timeout')), 5000)
        );

        const response = await Promise.race([sendPromise, timeoutPromise]);
        return { success: true, messageId: response };

    } catch (error) {
        const isInvalidToken = error.code?.includes('registration-token') || error.code?.includes('invalid-');
        return { success: false, error: error.message, invalidToken: isInvalidToken };
    }
};

/**
 * Send notification to multiple devices
 */
export const sendMulticastNotification = async (fcmTokens, notification, data = {}) => {
    if (!initialized || !messaging || !fcmTokens?.length) {
        return { success: false, error: 'Not ready' };
    }

    try {
        const message = {
            notification: { title: notification.title || 'Notification', body: notification.body || '' },
            data: { ...data, timestamp: new Date().toISOString() },
            tokens: fcmTokens,
            android: { priority: 'high' }
        };

        const response = await messaging.sendEachForMulticast(message);
        return { success: true, successCount: response.successCount, failureCount: response.failureCount };

    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Validate a token (dry-run)
 */
export const validateToken = async (fcmToken) => {
    if (!initialized || !messaging) return false;
    try {
        await messaging.send({ token: fcmToken, data: { test: 'true' } }, true);
        return true;
    } catch {
        return false;
    }
};

export default {
    sendNotification,
    sendMulticastNotification,
    validateToken,
    isInitialized: () => initialized
};
