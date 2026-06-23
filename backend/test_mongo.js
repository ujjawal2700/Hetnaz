import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = "mongodb://Dating-User:datingUserAssociate@ac-wlx5klx-shard-00-00.j03pv5w.mongodb.net:27017/dil_mate?ssl=true&authSource=admin";
console.log('Testing URI:', uri);

async function test() {
  const client = new MongoClient(uri, { family: 4 });
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected successfully!');
    await client.db('admin').command({ ping: 1 });
    console.log('Ping successful!');
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await client.close();
  }
}

test();
