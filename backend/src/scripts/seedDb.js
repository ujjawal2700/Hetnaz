/**
 * Database Seeding Script
 * @purpose: Populate MongoDB cluster with sample data for all models
 */

import 'dotenv/config';
import db from '../config/database.js';
import * as Models from '../models/index.js';
import logger from '../utils/logger.js';

// --- SAMPLE DATA DEFINITIONS ---

const SEED_DATA = {
  // 1. App Settings
  appSettings: {
    general: {
      platformName: 'Dil Mate',
      supportEmail: 'support@dilmate.com',
      supportPhone: '+91 919981331303',
      maintenanceMode: false,
    },
    messageCosts: {
      basic: 50,
      silver: 45,
      gold: 40,
      platinum: 35,
      hiMessage: 5,
      imageMessage: 100,
      videoCall: 500,
    },
    adminPhones: ['919981331303'],
  },

  // 2. Payout Slabs (Hostess Earnings)
  payoutSlabs: [
    { minCoins: 0, maxCoins: 1000, payoutPercentage: 40, displayOrder: 1 },
    { minCoins: 1001, maxCoins: 5000, payoutPercentage: 50, displayOrder: 2 },
    { minCoins: 5001, maxCoins: 15000, payoutPercentage: 55, displayOrder: 3 },
    { minCoins: 15001, maxCoins: null, payoutPercentage: 60, displayOrder: 4 },
  ],

  // 3. Coin Plans
  coinPlans: [
    { name: 'Starter Pack', tier: 'basic', priceInINR: 99, baseCoins: 100, bonusCoins: 0, totalCoins: 100, bonusPercentage: 0, badge: null, displayOrder: 1 },
    { name: 'Silver Glow', tier: 'silver', priceInINR: 499, baseCoins: 500, bonusCoins: 50, totalCoins: 550, bonusPercentage: 10, badge: 'POPULAR', displayOrder: 2 },
    { name: 'Golden Hearts', tier: 'gold', priceInINR: 999, baseCoins: 1000, bonusCoins: 200, totalCoins: 1200, bonusPercentage: 20, badge: 'BEST_VALUE', displayOrder: 3 },
    { name: 'Platinum Luxe', tier: 'platinum', priceInINR: 2499, baseCoins: 2500, bonusCoins: 750, totalCoins: 3250, bonusPercentage: 30, badge: null, displayOrder: 4 },
  ],

  // 4. Gifts
  gifts: [
    { name: 'Rose', category: 'romantic', cost: 10, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3504/3504820.png', displayOrder: 1 },
    { name: 'Love Heart', category: 'romantic', cost: 50, imageUrl: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', displayOrder: 2 },
    { name: 'Diamond Ring', category: 'romantic', cost: 1000, imageUrl: 'https://cdn-icons-png.flaticon.com/512/825/825590.png', displayOrder: 3 },
    { name: 'Teddy Bear', category: 'appreciation', cost: 200, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233514.png', displayOrder: 4 },
    { name: 'Champagne', category: 'celebration', cost: 500, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3132/3132644.png', displayOrder: 5 },
  ],

  // 5. Users (Female Discovery Profiles)
  females: [
    {
      phoneNumber: '910000000001',
      role: 'female',
      approvalStatus: 'approved',
      isVerified: true,
      profile: {
        name: 'Aishwarya Rai',
        age: 22,
        bio: 'Love traveling and exploring new cafes ☕',
        occupation: 'Model',
        photos: [{ url: 'https://images.unsplash.com/photo-1596215143922-eedeaba0d91c?w=400&h=400&fit=cover', isPrimary: true }],
        location: { city: 'Mumbai', coordinates: { coordinates: [72.8777, 19.0760] } }
      }
    },
    {
      phoneNumber: '910000000002',
      role: 'female',
      approvalStatus: 'approved',
      isVerified: true,
      isOnline: true,
      profile: {
        name: 'Priyanka Chopra',
        age: 24,
        bio: 'Music lover and professional dancer 💃',
        occupation: 'Dancer',
        photos: [{ url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=cover', isPrimary: true }],
        location: { city: 'Delhi', coordinates: { coordinates: [77.1025, 28.7041] } }
      }
    },
    {
      phoneNumber: '910000000003',
      role: 'female',
      approvalStatus: 'approved',
      isVerified: true,
      profile: {
        name: 'Sneha Kapoor',
        age: 21,
        bio: 'Tech enthusiast and foodie 🍔',
        occupation: 'Student',
        photos: [{ url: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400&h=400&fit=cover', isPrimary: true }],
        location: { city: 'Bangalore', coordinates: { coordinates: [77.5946, 12.9716] } }
      }
    },
    {
      phoneNumber: '910000000004',
      role: 'female',
      approvalStatus: 'approved',
      isVerified: true,
      isOnline: true,
      profile: {
        name: 'Ananya Pandey',
        age: 23,
        bio: 'Books and late-night drives 🌙',
        occupation: 'Actress',
        photos: [{ url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=cover', isPrimary: true }],
        location: { city: 'Mumbai', coordinates: { coordinates: [72.8777, 19.0760] } }
      }
    },
    {
        phoneNumber: '910000000005',
        role: 'female',
        approvalStatus: 'approved',
        isVerified: true,
        isOnline: true,
        profile: {
          name: 'Kiara Advani',
          age: 25,
          bio: 'Fitness and yoga 🧘‍♀️',
          occupation: 'Fashion Blogger',
          photos: [{ url: 'https://images.unsplash.com/photo-1574015974293-817f0efe0242?w=400&h=400&fit=cover', isPrimary: true }],
          location: { city: 'Mumbai', coordinates: { coordinates: [72.8777, 19.0760] } }
        }
    },
    {
        phoneNumber: '910000000006',
        role: 'female',
        approvalStatus: 'approved',
        isVerified: true,
        profile: {
          name: 'Shraddha Jain',
          age: 22,
          bio: 'Art and photography 🎨',
          occupation: 'Artist',
          photos: [{ url: 'https://images.unsplash.com/photo-1512413919939-d4000b809d43?w=400&h=400&fit=cover', isPrimary: true }],
          location: { city: 'Pune', coordinates: { coordinates: [73.8567, 18.5204] } }
        }
    }
  ],

  // 6. Test Accounts
  maleUser: {
    phoneNumber: '919981331303',
    role: 'male',
    isVerified: true,
    coinBalance: 500,
    genderPreference: 'female',
    profile: {
      name: 'Ujjawal',
      age: 22,
      photos: [{ url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=cover', isPrimary: true }]
    }
  },
  adminUser: {
    phoneNumber: '911111111111',
    role: 'admin',
    isVerified: true,
    profile: {
      name: 'Dil Mate Admin'
    }
  },

  // 7. Bypass Login Test Accounts (OTP: 123456)
  bypassFemale: {
    phoneNumber: '919988777665',
    role: 'female',
    approvalStatus: 'approved',
    isVerified: true,
    isActive: true,
    genderPreference: 'male',
    profile: {
      name: 'Priya Sharma',
      age: 24,
      bio: 'Fitness enthusiast and travel lover ✈️',
      occupation: 'Model',
      interests: ['Travel', 'Fitness', 'Music'],
      photos: [{ url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=cover', isPrimary: true, uploadedAt: new Date() }],
      location: { city: 'Mumbai', coordinates: { coordinates: [72.8777, 19.0760] } }
    }
  },
  bypassMale: {
    phoneNumber: '919988777664',
    role: 'male',
    approvalStatus: 'approved',
    isVerified: true,
    isActive: true,
    genderPreference: 'female',
    coinBalance: 100000,
    profile: {
      name: 'Rahul Dev',
      age: 27,
      bio: 'Entrepreneur with a passion for life 🎯',
      occupation: 'Entrepreneur',
      interests: ['Business', 'Travel', 'Sports'],
      photos: [{ url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=cover', isPrimary: true, uploadedAt: new Date() }],
      location: { city: 'Mumbai', coordinates: { coordinates: [72.8777, 19.0760] } }
    }
  }
};

async function seedDatabase() {
  try {
    logger.info('🌱 Starting Database Seeding...');

    // 1. Connect
    await db.connect();

    // 2. Clear Existing Data
    logger.info('🧹 Cleaning collections...');
    await Models.AppSettings.deleteMany({});
    await Models.PayoutSlab.deleteMany({});
    await Models.CoinPlan.deleteMany({});
    await Models.Gift.deleteMany({});
    await Models.User.deleteMany({});
    await Models.AutoMessageTemplate.deleteMany({});

    // 3. Seed App Settings
    logger.info('⚙️ Seeding App Settings...');
    await Models.AppSettings.create(SEED_DATA.appSettings);

    // 4. Seed Payout Slabs
    logger.info('📊 Seeding Payout Slabs...');
    await Models.PayoutSlab.insertMany(SEED_DATA.payoutSlabs);

    // 5. Seed Coin Plans
    logger.info('💰 Seeding Coin Plans...');
    await Models.CoinPlan.insertMany(SEED_DATA.coinPlans);

    // 6. Seed Gifts
    logger.info('🎁 Seeding Gifts...');
    await Models.Gift.insertMany(SEED_DATA.gifts);

    // 7. Seed Users
    logger.info('👥 Seeding Users...');
    
    // Seed Admin & Test Male
    await Models.User.create(SEED_DATA.adminUser);
    const maleUser = await Models.User.create(SEED_DATA.maleUser);

    // Seed Bypass Test Accounts
    logger.info('🔑 Seeding Bypass Login Test Accounts...');
    await Models.User.create(SEED_DATA.bypassFemale);
    await Models.User.create(SEED_DATA.bypassMale);
    logger.info('  ✅ Female bypass: +91-99887-77665 | OTP: 123456');
    logger.info('  ✅ Male bypass:   +91-99887-77664 | OTP: 123456 | Coins: 100,000');

    // Seed Females
    const extraFemalesData = [
        { name: 'Tara Sutaria', age: 24, bio: 'Singing and shopping 🛍️', occupation: 'Singer', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=cover' },
        { name: 'Nora Fatehi', age: 26, bio: 'Dance like nobody is watching 💃', occupation: 'Choreographer', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=cover' },
        { name: 'Sara Ali Khan', age: 23, bio: 'I love poetry and history 📜', occupation: 'Influencer', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=cover' },
        { name: 'Janhvi Kapoor', age: 24, bio: 'Traditional values with modern outlook 🌸', occupation: 'Designer', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=cover' },
        { name: 'Disha Patani', age: 25, bio: 'Nature and pets 🐶', occupation: 'Content Creator', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=cover' },
        { name: 'Tamannaah Bhatia', age: 25, bio: 'Movie buff and beach person 🌊', occupation: 'Writer', img: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=400&h=400&fit=cover' },
        { name: 'Alia Bhatt', age: 23, bio: 'I love dogs more than people 🐾', occupation: 'Chef', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=cover' },
        { name: 'Kriti Sanon', age: 24, bio: 'Strong believer in karma ☯️', occupation: 'Psychologist', img: 'https://images.unsplash.com/photo-1581403341630-a6e0b9d2d257?w=400&h=400&fit=cover' },
        { name: 'Rashmika Mandanna', age: 24, bio: 'Caring and positive soul ✨', occupation: 'Educator', img: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=400&fit=cover' },
        { name: 'Ileana D\'Cruz', age: 27, bio: 'Sunshine and ocean breeze 🌴', occupation: 'Diver', img: 'https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=400&h=400&fit=cover' }
    ];

    const allFemales = [...SEED_DATA.females].concat(
        extraFemalesData.map((f, i) => ({
            phoneNumber: `9110000000${10 + i}`,
            role: 'female',
            approvalStatus: 'approved',
            isOnline: i % 2 === 0,
            profile: {
                name: f.name,
                age: f.age,
                bio: f.bio,
                occupation: f.occupation,
                photos: [{ url: f.img, isPrimary: true }],
                location: { city: 'Mumbai', coordinates: { coordinates: [72.8777, 19.0760] } }
            }
        }))
    );

    const seededFemales = await Models.User.insertMany(allFemales);

    // 8. Seed Auto Message Templates for some females
    logger.info('✉️ Seeding Auto Message Templates...');
    const messageTemplates = [
        { name: 'Classic Greeting', content: 'Hey there! How is your day going? 😊' },
        { name: 'Direct Approach', content: 'You look interesting! Want to chat? ✨' },
        { name: 'Playful', content: 'Caught you looking! 😉 Hi!' }
    ];

    for (let i = 0; i < 5; i++) {
        const female = seededFemales[i];
        await Models.AutoMessageTemplate.create({
            userId: female._id,
            name: messageTemplates[i % 3].name,
            content: messageTemplates[i % 3].content,
            isEnabled: true,
            isDefault: true
        });
    }

    logger.info('✨ Database seeding completed successfully!');
  } catch (error) {
    logger.error('💥 Error seeding database:', error);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

seedDatabase();
