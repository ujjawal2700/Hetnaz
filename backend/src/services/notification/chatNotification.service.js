/**
 * Notification Helper for Chat Messages
 * Sends push notifications for chat-related events
 */

import fcmService from '../fcm.service.js';
import User from '../../models/User.js';
import fcmCleanup from '../../utils/fcmCleanup.js';
import logger from '../../utils/logger.js';

/**
 * Helper: Get all FCM tokens for a user (both web and app)
 * @param {object} user - User object with fcmTokensWeb and fcmTokensApp fields
 * @returns {Array<{token: string, platform: string}>} Array of token objects
 */
const getAllFcmTokens = (user) => {
    const tokens = [];
    if (user?.fcmTokensWeb) tokens.push({ token: user.fcmTokensWeb, platform: 'web' });
    if (user?.fcmTokensApp) tokens.push({ token: user.fcmTokensApp, platform: 'app' });
    return tokens;
};

/**
 * Send notification to a user for new message
 * @param {string} receiverId - User ID to send notification to
 * @param {object} sender - Sender user object
 * @param {object} messageData - Message details
 * @returns {Promise<object>} Send result
 */
export const notifyNewMessage = async (receiverId, sender, messageData) => {
    logger.debug('[NOTIFICATION] Sending new message notification', { receiverId, sender: sender.profile?.name, messageType: messageData.messageType });

    try {
        // Get receiver's FCM tokens (both web and app)
        const receiver = await User.findById(receiverId).select('fcmTokensWeb fcmTokensApp profile');
        const allTokens = getAllFcmTokens(receiver);

        if (!receiver || allTokens.length === 0) {
            return { success: false, reason: 'No FCM tokens' };
        }

        // Build notification title and body based on message type
        const senderName = sender.profile?.name || 'Someone';
        let title, body, icon;

        // Helper: Validate icon URL (avoid base64, only use HTTP URLs)
        const getValidIconUrl = (url) => {
            if (!url || typeof url !== 'string') return '/DilMate.png';
            if (url.startsWith('data:')) return '/DilMate.png'; // Skip base64
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            return '/DilMate.png'; // Default
        };

        switch (messageData.messageType) {
            case 'image':
                title = `📸 ${senderName}`;
                body = 'Sent you a photo';
                icon = '/DilMate.png';
                break;

            case 'gift': {
                const giftNames = messageData.gifts?.map(g => g.giftName).join(', ') || 'a gift';
                const totalCoins = messageData.gifts?.reduce((sum, g) => sum + g.giftCost, 0) || 0;
                title = `🎁 ${senderName}`;
                body = `Sent you ${giftNames}${totalCoins ? ` (+${totalCoins} coins)` : ''}`;
                // Use gift image if valid URL
                icon = getValidIconUrl(messageData.gifts?.[0]?.giftImage);
                break;
            }

            case 'text':
            default:
                title = `💬 ${senderName}`;
                body = messageData.content || 'Sent you a message';
                // Truncate long messages
                if (body.length > 100) {
                    body = body.substring(0, 97) + '...';
                }
                // Use sender photo if valid URL
                icon = getValidIconUrl(sender.profile?.photos?.[0]?.url);
                break;
        }

        logger.debug('[NOTIFICATION] Building push payload', { title, bodyLength: body?.length });

        // Notification data payload
        const data = {
            type: 'new_message',
            chatId: messageData.chatId.toString(),
            messageId: messageData.messageId.toString(),
            senderId: sender._id.toString(),
            senderName,
            messageType: messageData.messageType,
            timestamp: new Date().toISOString()
        };

        // Send to all receiver's tokens IN PARALLEL (web + app)
        const results = await Promise.all(allTokens.map(async ({ token, platform }) => {

            const result = await fcmService.sendNotification(token, {
                title,
                body,
                icon
            }, data);

            return { token, platform, result };
        }));

        const successCount = results.filter(r => r.result.success).length;
        logger.debug('[NOTIFICATION] Push result', { successCount, total: results.length });

        // Auto-cleanup invalid tokens
        const invalidResults = results.filter(r => !r.result.success && r.result.invalidToken);
        if (invalidResults.length > 0) {
            for (const { platform } of invalidResults) {
                await fcmCleanup.removeInvalidToken(receiverId, platform);
            }
        }

        return {
            success: successCount > 0,
            successCount,
            totalCount: results.length,
            cleanedUp: invalidResults.length
        };

    } catch (error) {
        logger.error('[NOTIFICATION] Error sending new message notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification for video call
 * @param {string} receiverId - User ID to send notification to
 * @param {object} caller - Caller user object
 * @param {string} callId - Call ID
 * @returns {Promise<object>} Send result
 */
export const notifyVideoCall = async (receiverId, caller, callId) => {
    logger.debug('[NOTIFICATION] Sending video call notification', { receiverId, caller: caller.profile?.name });

    try {
        const receiver = await User.findById(receiverId).select('fcmTokensWeb fcmTokensApp');
        const allTokens = getAllFcmTokens(receiver);

        if (!receiver || allTokens.length === 0) {
            return { success: false, reason: 'No FCM tokens' };
        }

        const callerName = caller.profile?.name || 'Someone';
        const title = `📹✨${callerName} is calling...`;
        const body = 'Tap to answer';

        const data = {
            type: 'video_call',
            callId: callId.toString(),
            callerId: caller._id.toString(),
            callerName,
            timestamp: new Date().toISOString()
        };

        const results = [];
        const invalidPlatforms = [];

        for (const { token, platform } of allTokens) {
            const result = await fcmService.sendNotification(token, {
                title,
                body,
                icon: caller.profile?.photos?.[0]?.url || '/DilMate.png'
            }, data);

            results.push(result);

            if (!result.success && result.invalidToken) {
                invalidPlatforms.push(platform);
            }
        }

        // Auto-cleanup
        for (const platform of invalidPlatforms) {
            await fcmCleanup.removeInvalidToken(receiverId, platform);
        }

        const successCount = results.filter(r => r.success).length;
        return {
            success: successCount > 0,
            successCount,
            totalCount: results.length
        };

    } catch (error) {
        logger.error('[NOTIFICATION] Error sending video call notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify user about low coin balance
 * @param {string} userId - User ID to notify
 * @param {number} currentBalance - Current coin balance
 * @returns {Promise<object>} Send result
 */
export const notifyLowBalance = async (userId, currentBalance) => {
    logger.debug('[NOTIFICATION] Sending low balance notification', { userId, currentBalance });

    try {
        const user = await User.findById(userId).select('fcmTokensWeb fcmTokensApp');
        const allTokens = getAllFcmTokens(user);

        if (!user || allTokens.length === 0) {
            return { success: false, reason: 'No FCM tokens' };
        }

        const title = '⚠️ Low Balance Warning';
        const body = `You have ${currentBalance} coins left. Top up to keep chatting!`;

        const data = {
            type: 'low_balance',
            balance: currentBalance.toString(),
            timestamp: new Date().toISOString()
        };

        const results = [];
        for (const { token } of allTokens) {
            const result = await fcmService.sendNotification(token, {
                title,
                body,
                icon: '/DilMate.png'
            }, data);
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;

        return { success: successCount > 0, successCount };

    } catch (error) {
        logger.error('[NOTIFICATION] Error sending low balance notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify user about daily reward availability
 * @param {string} userId - User ID to notify
 * @param {number} rewardAmount - Amount of coins available
 * @returns {Promise<object>} Send result
 */
export const notifyDailyReward = async (userId, rewardAmount = 10) => {
    logger.debug('[NOTIFICATION] Sending daily reward notification', { userId, rewardAmount });

    try {
        const user = await User.findById(userId).select('fcmTokensWeb fcmTokensApp');
        const allTokens = getAllFcmTokens(user);

        if (!user || allTokens.length === 0) {
            return { success: false, reason: 'No FCM tokens' };
        }

        const title = '🎁 Daily Reward Ready!';
        const body = `Claim your ${rewardAmount} free coins now!`;

        const data = {
            type: 'daily_reward',
            rewardAmount: rewardAmount.toString(),
            timestamp: new Date().toISOString()
        };

        const results = [];
        for (const { token } of allTokens) {
            const result = await fcmService.sendNotification(token, {
                title,
                body,
                icon: '/DilMate.png'
            }, data);
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        return { success: successCount > 0, successCount };

    } catch (error) {
        logger.error('[NOTIFICATION] Error sending daily reward notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify male users about a new nearby female user
 * @param {string} maleUserId - Male user ID to notify
 * @param {object} femaleUser - New female user object
 * @param {number} distance - Distance in km (optional)
 * @returns {Promise<object>} Send result
 */
export const notifyNewNearbyUser = async (maleUserId, femaleUser, distance = null) => {
    logger.debug('[NOTIFICATION] Sending new nearby user notification', { maleUserId, femaleName: femaleUser.profile?.name });

    try {
        const maleUser = await User.findById(maleUserId).select('fcmTokensWeb fcmTokensApp');
        const allTokens = getAllFcmTokens(maleUser);

        if (!maleUser || allTokens.length === 0) {
            return { success: false, reason: 'No FCM tokens' };
        }

        const femaleName = femaleUser.profile?.name || 'Someone new';
        const femaleAge = femaleUser.profile?.age || '';
        const distanceText = distance ? ` (${Math.round(distance)}km away)` : '';

        const title = '💃 New Girl Nearby!';
        const body = `${femaleName}${femaleAge ? `, ${femaleAge}` : ''} just joined${distanceText}`;

        // Helper: Validate icon URL
        const getValidIconUrl = (url) => {
            if (!url || typeof url !== 'string') return '/DilMate.png';
            if (url.startsWith('data:')) return '/DilMate.png';
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            return '/DilMate.png';
        };

        const data = {
            type: 'new_nearby_user',
            femaleUserId: femaleUser._id.toString(),
            femaleName,
            timestamp: new Date().toISOString()
        };

        const results = [];
        for (const { token } of allTokens) {
            const result = await fcmService.sendNotification(token, {
                title,
                body,
                icon: getValidIconUrl(femaleUser.profile?.photos?.[0]?.url)
            }, data);
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        return { success: successCount > 0, successCount };

    } catch (error) {
        logger.error('[NOTIFICATION] Error sending nearby user notification:', error);
        return { success: false, error: error.message };
    }
};

export default {
    notifyNewMessage,
    notifyVideoCall,
    notifyLowBalance,
    notifyDailyReward,
    notifyNewNearbyUser
};
