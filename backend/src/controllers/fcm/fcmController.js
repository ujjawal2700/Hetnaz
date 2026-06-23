/**
 * FCM Controller - Handle FCM token registration (FIRE-AND-FORGET)
 * POST /api/fcm/register responds IMMEDIATELY
 * All heavy logic runs in background via setImmediate
 */

import User from '../../models/User.js';
import logger from '../../utils/logger.js';

/**
 * Register/Update FCM token for a user (NON-BLOCKING)
 * POST /api/fcm/register
 * Body: { fcmToken: string, platform: 'web' | 'app' }
 * 
 * Stores single token per platform (replaces existing)
 */
export const registerFCMToken = async (req, res, next) => {
    const { fcmToken, platform = 'web' } = req.body;
    const userId = req.user?.id;

    if (!fcmToken || !userId) {
        return res.status(400).json({ status: 'error', message: 'FCM token is required' });
    }

    // Validate platform
    const validPlatforms = ['web', 'app'];
    const normalizedPlatform = validPlatforms.includes(platform?.toLowerCase())
        ? platform.toLowerCase()
        : 'web';

    // RESPOND IMMEDIATELY - Fire and forget pattern
    res.status(200).json({
        status: 'success',
        message: 'FCM token registration accepted',
        data: { platform: normalizedPlatform }
    });

    // Background processing - does NOT block the response
    setImmediate(async () => {
        try {
            // Determine which field to update based on platform
            const tokenField = normalizedPlatform === 'app' ? 'fcmTokensApp' : 'fcmTokensWeb';

            // Simple string replacement (not array)
            await User.findByIdAndUpdate(userId, { [tokenField]: fcmToken });

            logger.debug(`[FCM] Token registered for ${normalizedPlatform} platform, user: ${userId}`);
        } catch (e) {
            logger.error('[FCM-BG] Token registration error:', e.message);
        }
    });
};

/**
 * Send test notification to user
 * POST /api/fcm/test
 */
export const sendTestNotification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('fcmTokensWeb fcmTokensApp profile phoneNumber').lean();

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Collect all available tokens (both platforms)
        const tokens = [];
        if (user.fcmTokensWeb) tokens.push({ token: user.fcmTokensWeb, platform: 'web' });
        if (user.fcmTokensApp) tokens.push({ token: user.fcmTokensApp, platform: 'app' });

        if (tokens.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No FCM tokens registered.' });
        }

        // Import service only when needed
        const fcmService = (await import('../../services/fcm.service.js')).default;

        const notification = {
            title: '🎉 Test Notification',
            body: 'This is a test push notification from Dil Mate!',
            icon: '/DilMate.png'
        };

        const data = { type: 'test', timestamp: new Date().toISOString() };

        // Send to all tokens
        const results = await Promise.all(
            tokens.map(async ({ token, platform }) => {
                const result = await fcmService.sendNotification(token, notification, data);
                return { ...result, platform };
            })
        );

        const successCount = results.filter(r => r.success).length;

        // Cleanup invalid tokens in background
        setImmediate(async () => {
            for (const result of results) {
                if (!result.success && result.invalidToken) {
                    const field = result.platform === 'app' ? 'fcmTokensApp' : 'fcmTokensWeb';
                    await User.findByIdAndUpdate(userId, { [field]: null });
                    logger.debug(`[FCM] Cleared invalid ${result.platform} token for user: ${userId}`);
                }
            }
        });

        res.status(200).json({
            status: 'success',
            message: `Test notification sent to ${successCount}/${results.length} device(s)`,
            data: { successCount, totalCount: results.length }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Remove FCM token for a user
 * DELETE /api/fcm/token
 * Body: { platform: 'web' | 'app' }
 * 
 * Sets the platform token to null
 */
export const removeFCMToken = async (req, res, next) => {
    const { platform = 'web' } = req.body;
    const userId = req.user?.id;

    // Validate platform
    const validPlatforms = ['web', 'app'];
    const normalizedPlatform = validPlatforms.includes(platform?.toLowerCase())
        ? platform.toLowerCase()
        : 'web';

    // Respond immediately
    res.status(200).json({
        status: 'success',
        message: 'FCM token removal accepted',
        data: { platform: normalizedPlatform }
    });

    // Background removal - set to null
    setImmediate(async () => {
        try {
            const tokenField = normalizedPlatform === 'app' ? 'fcmTokensApp' : 'fcmTokensWeb';
            await User.findByIdAndUpdate(userId, { [tokenField]: null });
            logger.debug(`[FCM] Token removed from ${normalizedPlatform} platform, user: ${userId}`);
        } catch (e) {
            logger.error('[FCM-BG] Token removal error:', e.message);
        }
    });
};

export default { registerFCMToken, sendTestNotification, removeFCMToken };
