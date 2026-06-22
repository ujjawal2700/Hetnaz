import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../config/database.js';

async function dropStaleIndexes() {
  try {
    await db.connect();
    console.log('Connected to drop indexes...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollExists = collections.some(col => col.name === 'users');
    if (userCollExists) {
      console.log('Found users collection. Checking indexes...');
      const indexes = await mongoose.connection.db.collection('users').indexes();
      console.log('Current indexes:', indexes);
      const hasPhoneIndex = indexes.some(idx => idx.name === 'phone_1');
      if (hasPhoneIndex) {
        console.log('Dropping phone_1 index...');
        await mongoose.connection.db.collection('users').dropIndex('phone_1');
        console.log('Successfully dropped phone_1 index!');
      } else {
        console.log('No phone_1 index found.');
      }
    } else {
      console.log('Users collection not found.');
    }
  } catch (error) {
    console.error('Error dropping index:', error);
  } finally {
    await db.disconnect();
    process.exit(0);
  }
}

dropStaleIndexes();
