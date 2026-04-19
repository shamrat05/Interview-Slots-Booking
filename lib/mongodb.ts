import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  client = new MongoClient(uri);
  await client.connect();
  db = client.db('interview_slots');

  // Ensure indexes for uniqueness and fast lookups
  await db.collection('bookings').createIndex({ date: 1, slotId: 1 }, { unique: true });
  await db.collection('blocked_slots').createIndex({ date: 1, slotId: 1 }, { unique: true });
  await db.collection('blocked_days').createIndex({ date: 1 }, { unique: true });
  await db.collection('final_round_slots').createIndex({ date: 1, slotId: 1 }, { unique: true });
  await db.collection('app_config').createIndex({ key: 1 }, { unique: true });
  await db.collection('jobs').createIndex({ id: 1 }, { unique: true });

  return db;
}
