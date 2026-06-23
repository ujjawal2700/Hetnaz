/**
 * App Settings Model - Global Platform Configuration
 * @owner: Sujal (Admin Domain)
 * @purpose: Store platform-wide settings like costs, limits, and maintenance mode
 */

import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema(
    {
        general: {
            platformName: { type: String, default: 'Dil Mate' },
            supportEmail: { type: String, default: 'support@dilmate.com' },
            supportPhone: { type: String, default: '+91 9876543210' },
            termsOfServiceUrl: { type: String, default: '' },
            privacyPolicyUrl: { type: String, default: '' },
            maintenanceMode: { type: Boolean, default: false },
            registrationEnabled: { type: Boolean, default: true },
        },
        withdrawal: {
            minAmount: { type: Number, default: 500 },
            maxAmount: { type: Number, default: 50000 },
            processingFee: { type: Number, default: 0 },
            dailyLimit: { type: Number, default: 10000 },
            weeklyLimit: { type: Number, default: 50000 },
        },
        messageCosts: {
            // Tier-based message costs (for regular messages)
            basic: { type: Number, default: 50 },
            silver: { type: Number, default: 45 },
            gold: { type: Number, default: 40 },
            platinum: { type: Number, default: 35 },

            // Special message types
            hiMessage: { type: Number, default: 5 },
            imageMessage: { type: Number, default: 100 },

            // Video call cost
            videoCall: { type: Number, default: 500 },
        },
        giftCosts: {
            // Default cost for new gifts
            defaultCost: { type: Number, default: 100 },
        },
        // Referral program settings
        referral: {
            rewardAmount: { type: Number, default: 200 },
            isEnabled: { type: Boolean, default: true },
        },
        // Video Call specific limits (Priority over .env)
        videoCall: {
            durationSeconds: { type: Number, default: 300 },
            connectionTimeoutSeconds: { type: Number, default: 20 },
            maxConcurrentCalls: { type: Number, default: 1 },
        },
        // Security & Performance limits
        security: {
            rateLimitMaxRequests: { type: Number, default: 100 },
            rateLimitWindowMs: { type: Number, default: 900000 }, // 15 mins
        },
        // Admin authentication secret (bypass OTP for admin login)
        adminSecret: { type: String, default: '123456' },
        // List of admin phone numbers
        adminPhones: { type: [String], default: ['919981331303'] },
        // Male user levels config
        maleLevels: {
            type: [
                {
                    level: { type: Number, required: true },
                    minCoinsSpent: { type: Number, required: true },
                    badgeName: { type: String, default: '' }
                }
            ],
            default: [
                { level: 1, minCoinsSpent: 0, badgeName: 'Novice' },
                { level: 2, minCoinsSpent: 1000, badgeName: 'Explorer' },
                { level: 3, minCoinsSpent: 3000, badgeName: 'Chaser' },
                { level: 4, minCoinsSpent: 6000, badgeName: 'Vanguard' },
                { level: 5, minCoinsSpent: 10000, badgeName: 'Elite' },
                { level: 6, minCoinsSpent: 20000, badgeName: 'Titan' }
            ]
        }
    },
    {
        timestamps: true,
    }
);

// In-memory cache for settings
let cachedSettings = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// We only ever want ONE settings document
appSettingsSchema.statics.getSettings = async function (forceRefresh = false) {
    const now = Date.now();

    // Return cached settings if available and not expired
    if (!forceRefresh && cachedSettings && (now - lastCacheUpdate < CACHE_DURATION)) {
        return cachedSettings;
    }

    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }

    // Update cache
    cachedSettings = settings;
    lastCacheUpdate = now;

    return settings;
};

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
