/**
 * Wallet Controller - Coin Economy Management
 * @owner: Sujal (Wallet Domain)
 * @purpose: Handle coin plans, purchases, withdrawals, and transactions
 */

import mongoose from 'mongoose';
import CoinPlan from '../../models/CoinPlan.js';
import PayoutSlab from '../../models/PayoutSlab.js';
import Transaction from '../../models/Transaction.js';
import Withdrawal from '../../models/Withdrawal.js';
import User from '../../models/User.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import transactionService from '../../services/wallet/transactionService.js';
import dataValidation from '../../core/validation/dataValidation.js';
import relationshipManager from '../../core/relationships/relationshipManager.js';
import transactionManager from '../../core/transactions/transactionManager.js';

// ========================
// COIN PLANS (Public + Admin)
// ========================

/**
 * Get all active coin plans (for Male users)
 */
export const getCoinPlans = async (req, res, next) => {
    try {
        const plans = await CoinPlan.find({ isActive: true })
            .sort({ displayOrder: 1 });

        res.status(200).json({
            status: 'success',
            data: { plans }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all coin plans (Admin only - includes inactive)
 */
export const getAllCoinPlans = async (req, res, next) => {
    try {
        const plans = await CoinPlan.find()
            .sort({ displayOrder: 1 });

        res.status(200).json({
            status: 'success',
            data: { plans }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new coin plan (Admin only)
 */
export const createCoinPlan = async (req, res, next) => {
    try {
        const { name, tier, priceInINR, baseCoins, bonusCoins, badge, displayOrder, description } = req.body;

        const plan = await CoinPlan.create({
            name,
            tier,
            priceInINR,
            baseCoins,
            bonusCoins: bonusCoins || 0,
            totalCoins: baseCoins + (bonusCoins || 0),
            badge,
            displayOrder,
            description,
            isActive: true
        });

        res.status(201).json({
            status: 'success',
            data: { plan }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a coin plan (Admin only)
 */
export const updateCoinPlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const plan = await CoinPlan.findById(id);

        if (!plan) {
            throw new NotFoundError('Coin plan not found');
        }

        // Apply updates
        Object.assign(plan, updates);

        // Save plan (triggers pre-save hooks to recalculate totalCoins and bonusPercentage)
        await plan.save();

        res.status(200).json({
            status: 'success',
            data: { plan }
        });
    } catch (error) {
        next(error);
    }
};


/**
 * Delete a coin plan (Admin only - soft delete by setting isActive: false)
 */
export const deleteCoinPlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        const plan = await CoinPlan.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!plan) {
            throw new NotFoundError('Coin plan not found');
        }

        res.status(200).json({
            status: 'success',
            message: 'Coin plan deactivated'
        });
    } catch (error) {
        next(error);
    }
};

// ========================
// PAYOUT SLABS (Admin only)
// ========================

/**
 * Get all payout slabs
 */
export const getPayoutSlabs = async (req, res, next) => {
    try {
        const slabs = await PayoutSlab.find({ isActive: true })
            .sort({ displayOrder: 1 });

        res.status(200).json({
            status: 'success',
            data: { slabs }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a payout slab (Admin only)
 */
export const createPayoutSlab = async (req, res, next) => {
    try {
        const { minCoins, maxCoins, payoutPercentage, displayOrder } = req.body;

        const slab = await PayoutSlab.create({
            minCoins,
            maxCoins,
            payoutPercentage,
            displayOrder,
            isActive: true
        });

        res.status(201).json({
            status: 'success',
            data: { slab }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a payout slab (Admin only)
 */
export const updatePayoutSlab = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Fetch the slab first
        const slab = await PayoutSlab.findById(id);

        if (!slab) {
            throw new NotFoundError('Payout slab not found');
        }

        // Apply updates
        Object.assign(slab, updates);

        // Validate and save
        await slab.save();

        res.status(200).json({
            status: 'success',
            data: { slab }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a payout slab (Admin only)
 */
export const deletePayoutSlab = async (req, res, next) => {
    try {
        const { id } = req.params;

        const slab = await PayoutSlab.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!slab) {
            throw new NotFoundError('Payout slab not found');
        }

        res.status(200).json({
            status: 'success',
            message: 'Payout slab deactivated'
        });
    } catch (error) {
        next(error);
    }
};

// ========================
// TRANSACTIONS
// ========================

/**
 * Get user's transaction history
 */
export const getMyTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type, direction, limit = 50, page = 1 } = req.query;

        const skip = (page - 1) * limit;

        const transactions = await transactionService.getUserTransactions(userId, {
            type,
            direction,
            limit: parseInt(limit),
            skip
        });

        const total = await Transaction.countDocuments({ userId });

        res.status(200).json({
            status: 'success',
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get earnings summary for female users
 */
export const getEarningsSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const currentUserId = new mongoose.Types.ObjectId(userId);

        // Calculate time ranges
        const now = new Date();
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1-7. Execute all queries in PARALLEL
        const [
            totalEarningsData,
            withdrawalsData,
            earningsByTypeData,
            user,
            monthlyEarningsData,
            weeklyEarningsData,
            dailyEarningsData
        ] = await Promise.all([
            // 1. Total Earnings
            Transaction.aggregate([
                { $match: { userId: currentUserId, direction: 'credit', type: { $in: ['message_earned', 'video_call_earned', 'gift_received'] }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amountCoins' } } }
            ]),
            // 2. Withdrawals
            Withdrawal.aggregate([
                { $match: { userId: currentUserId, status: { $in: ['pending', 'approved', 'paid'] } } },
                { $group: { _id: null, total: { $sum: '$coinsRequested' } } }
            ]),
            // 3. Earnings by Type
            Transaction.aggregate([
                { $match: { userId: currentUserId, direction: 'credit', type: { $in: ['message_earned', 'video_call_earned', 'gift_received'] }, status: 'completed' } },
                { $group: { _id: '$type', amount: { $sum: '$amountCoins' } } }
            ]),
            // 4. User Balance
            User.findById(userId).select('coinBalance').lean(),
            // 5. Monthly Earnings
            Transaction.aggregate([
                { $match: { userId: currentUserId, direction: 'credit', type: { $in: ['message_earned', 'video_call_earned', 'gift_received'] }, status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amountCoins' } } }
            ]),
            // 6. Weekly Earnings
            Transaction.aggregate([
                { $match: { userId: currentUserId, direction: 'credit', type: { $in: ['message_earned', 'video_call_earned', 'gift_received'] }, status: 'completed', createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$amountCoins' } } }
            ]),
            // 7. Daily Earnings
            Transaction.aggregate([
                { $match: { userId: currentUserId, direction: 'credit', type: { $in: ['message_earned', 'video_call_earned', 'gift_received'] }, status: 'completed', createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$amountCoins' } } }
            ])
        ]);

        // Process results
        const totalEarnings = totalEarningsData.length > 0 ? totalEarningsData[0].total : 0;
        const totalWithdrawals = withdrawalsData.length > 0 ? withdrawalsData[0].total : 0;
        const availableBalance = Math.max(0, totalEarnings - totalWithdrawals);

        const earningsByType = {
            message_earned: 0,
            video_call_earned: 0,
            gift_received: 0
        };
        earningsByTypeData.forEach(item => {
            earningsByType[item._id] = item.amount;
        });

        const monthlyEarnings = monthlyEarningsData.length > 0 ? monthlyEarningsData[0].total : 0;
        const weeklyEarnings = weeklyEarningsData.length > 0 ? weeklyEarningsData[0].total : 0;
        const dailyEarnings = dailyEarningsData.length > 0 ? dailyEarningsData[0].total : 0;

        res.status(200).json({
            status: 'success',
            data: {
                totalEarnings,
                availableBalance,
                earningsByType,
                periodStats: {
                    daily: dailyEarnings,
                    weekly: weeklyEarnings,
                    monthly: monthlyEarnings
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's current balance (OPTIMIZED - uses cached req.user)
 */
export const getMyBalance = async (req, res, next) => {
    try {
        // req.user is already populated by auth middleware (cached)
        res.status(200).json({
            status: 'success',
            data: {
                balance: req.user.coinBalance || 0,
                memberTier: req.user.memberTier || 'basic'
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========================
// WITHDRAWALS (Female only)
// ========================

/**
 * Request a withdrawal (Female only)
 */
export const requestWithdrawal = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { coinsRequested, payoutMethod, payoutDetails } = req.body;

        // Validate withdrawal
        await dataValidation.validateWithdrawal(userId, coinsRequested);

        // Find applicable payout slab
        const slab = await PayoutSlab.findApplicableSlab(coinsRequested);
        if (!slab) {
            throw new BadRequestError('No applicable payout slab found');
        }

        // Calculate payout
        const payoutPercentage = slab.payoutPercentage;
        const payoutAmountINR = (coinsRequested * payoutPercentage) / 100;
        const processingFee = 0; // Can be configured
        const netPayoutAmount = payoutAmountINR - processingFee;

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
            userId,
            coinsRequested,
            payoutMethod,
            payoutDetails,
            payoutPercentage,
            payoutAmountINR,
            processingFee,
            netPayoutAmount,
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            data: { withdrawal }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my withdrawal requests (Female only)
 */
export const getMyWithdrawals = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, limit = 20, page = 1 } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Withdrawal.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                withdrawals,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel a pending withdrawal (Female only)
 */
export const cancelWithdrawal = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const withdrawal = await Withdrawal.findOne({ _id: id, userId });

        if (!withdrawal) {
            throw new NotFoundError('Withdrawal request not found');
        }

        if (withdrawal.status !== 'pending') {
            throw new BadRequestError('Only pending withdrawals can be cancelled');
        }

        withdrawal.status = 'cancelled';
        await withdrawal.save();

        res.status(200).json({
            status: 'success',
            data: { withdrawal }
        });
    } catch (error) {
        next(error);
    }
};

// ========================
// ADMIN WITHDRAWAL MANAGEMENT
// ========================

/**
 * Get all pending withdrawals (Admin only)
 */
export const getPendingWithdrawals = async (req, res, next) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;

        const query = {};
        // Only filter by status if it's not 'all'
        if (status && status !== 'all') {
            query.status = status;
        }
        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find(query)
            .populate('userId', 'profile phoneNumber coinBalance')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        // Transform to include user name
        const transformedWithdrawals = withdrawals.map(w => {
            const withdrawal = w.toObject();
            if (withdrawal.userId && typeof withdrawal.userId === 'object') {
                withdrawal.userName = withdrawal.userId.profile?.name || `User ${withdrawal.userId.phoneNumber}`;
            }
            return withdrawal;
        });

        const total = await Withdrawal.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                withdrawals: transformedWithdrawals,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve a withdrawal (Admin only)
 */
export const approveWithdrawal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const result = await transactionManager.executeTransaction([
            async (session) => {
                return await relationshipManager.handleWithdrawalApproval(id, adminId, session);
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                withdrawal: result.withdrawal,
                message: 'Withdrawal approved successfully'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject a withdrawal (Admin only)
 */
export const rejectWithdrawal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        if (!reason) {
            throw new BadRequestError('Rejection reason is required');
        }

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) {
            throw new NotFoundError('Withdrawal request not found');
        }

        if (withdrawal.status !== 'pending') {
            throw new BadRequestError('Only pending withdrawals can be rejected');
        }

        withdrawal.status = 'rejected';
        withdrawal.reviewedBy = adminId;
        withdrawal.reviewedAt = new Date();
        withdrawal.rejectionReason = reason;
        await withdrawal.save();

        res.status(200).json({
            status: 'success',
            data: {
                withdrawal,
                message: 'Withdrawal rejected'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark withdrawal as paid (Admin only)
 */
export const markWithdrawalPaid = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentTransactionId } = req.body;

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) {
            throw new NotFoundError('Withdrawal request not found');
        }

        if (withdrawal.status !== 'approved') {
            throw new BadRequestError('Only approved withdrawals can be marked as paid');
        }

        withdrawal.status = 'paid';
        withdrawal.paidAt = new Date();
        withdrawal.paymentTransactionId = paymentTransactionId;
        await withdrawal.save();

        res.status(200).json({
            status: 'success',
            data: {
                withdrawal,
                message: 'Withdrawal marked as paid'
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========================
// ADMIN TRANSACTIONS VIEW
// ========================

/**
 * Get all transactions (Admin only)
 */
export const getAllTransactions = async (req, res, next) => {
    try {
        const { type, direction, userId, limit = 50, page = 1 } = req.query;

        const query = {};
        if (type) query.type = type;
        if (direction) query.direction = direction;
        if (userId) query.userId = userId;

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find(query)
            .populate('userId', 'profile.name phoneNumber role')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
