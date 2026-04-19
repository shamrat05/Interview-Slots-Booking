import { getDb } from './lib/mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  console.log('Testing MongoDB connection...');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  try {
    const db = await getDb();
    await db.collection('_test').insertOne({ test: true, ts: new Date() });
    await db.collection('_test').deleteOne({ test: true });
    console.log('MongoDB connected and working successfully');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
}

test();
