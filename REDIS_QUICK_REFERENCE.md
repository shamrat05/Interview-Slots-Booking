# 🚀 Redis Quick Reference - Interview Scheduler

## 📦 What's Installed

- ✅ `redis` package (v5.10.0)
- ✅ `@vercel/kv` package (v3.0.0) - Already existed
- ✅ Redis client utility at `lib/redis.ts`
- ✅ Test API endpoints created
- ✅ Environment variables configured

## 🔑 Environment Variables (.env.local)

```bash
REDIS_URL="redis://default:XTjs3lXaPhdShW0XAYQdhAkg6xIDfE5l@redis-14920.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14920"
KV_REST_API_URL="https://redis-14920.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14920"
KV_REST_API_TOKEN="XTjs3lXaPhdShW0XAYQdhAkg6xIDfE5l"
```

## 🧪 Test Endpoints

### 1. `/api/redis-test` - Full CRUD testing
- **GET** - Retrieve a test value
- **POST** - Set a test value  
- **DELETE** - Delete a test value

### 2. `/api/cache-example` - Caching example
- **GET** `?date=2024-01-27` - Get cached slot data
- **DELETE** `?date=2024-01-27` - Clear cache for date

## 💻 Usage Examples

### Basic Operations

```typescript
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  const redis = await getRedisClient();
  
  // String operations
  await redis.set('key', 'value');
  const value = await redis.get('key');
  
  // With expiration (5 minutes)
  await redis.set('session:123', 'data', { EX: 300 });
  
  // Delete
  await redis.del('key');
  
  // Check existence
  const exists = await redis.exists('key'); // returns 1 or 0
  
  return NextResponse.json({ value });
}
```

### Advanced Operations

```typescript
// Store JSON objects
await redis.set('user:123', JSON.stringify({
  name: 'John',
  email: 'john@example.com'
}));

const userData = JSON.parse(await redis.get('user:123') || '{}');

// Hash operations
await redis.hSet('booking:456', {
  name: 'Alice',
  date: '2024-01-27',
  time: '10:00'
});

const booking = await redis.hGetAll('booking:456');

// Lists (for queues)
await redis.lPush('queue:emails', 'email1@example.com');
await redis.lPush('queue:emails', 'email2@example.com');
const email = await redis.rPop('queue:emails');

// Sets (for unique collections)
await redis.sAdd('tags:article:1', 'redis');
await redis.sAdd('tags:article:1', 'nodejs');
const tags = await redis.sMembers('tags:article:1');

// Sorted sets (for leaderboards, rankings)
await redis.zAdd('scores', { score: 100, value: 'player1' });
await redis.zAdd('scores', { score: 200, value: 'player2' });
const topPlayers = await redis.zRange('scores', 0, 9); // Top 10
```

### Caching Pattern

```typescript
async function getCachedData(key: string, fetchFn: () => Promise<any>, ttl = 300) {
  const redis = await getRedisClient();
  
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached as string);
  }
  
  // Fetch fresh data
  const freshData = await fetchFn();
  
  // Cache it
  await redis.set(key, JSON.stringify(freshData), { EX: ttl });
  
  return freshData;
}

// Usage
const slots = await getCachedData(
  'slots:2024-01-27',
  () => generateTimeSlots({ numberOfDays: 1 }),
  300 // Cache for 5 minutes
);
```

## 🌐 Testing in Browser Console

```javascript
// Test POST - Set a value
await fetch('/api/redis-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    key: 'test-key', 
    value: 'Hello from browser!' 
  })
}).then(r => r.json()).then(console.log);

// Test GET - Retrieve value
await fetch('/api/redis-test')
  .then(r => r.json())
  .then(console.log);

// Test cache example
await fetch('/api/cache-example?date=2024-01-27')
  .then(r => r.json())
  .then(console.log);
```

## 📝 Common Use Cases

### 1. Session Storage
```typescript
// Set session
await redis.set(`session:${sessionId}`, JSON.stringify(userData), { 
  EX: 86400 // 24 hours
});

// Get session
const session = JSON.parse(await redis.get(`session:${sessionId}`) || 'null');
```

### 2. Rate Limiting
```typescript
const key = `rate:${userId}:${endpoint}`;
const requests = await redis.incr(key);

if (requests === 1) {
  await redis.expire(key, 60); // 1 minute window
}

if (requests > 10) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 3. Temporary Data Storage
```typescript
// Store OTP for 10 minutes
await redis.set(`otp:${email}`, code, { EX: 600 });

// Verify OTP
const storedOtp = await redis.get(`otp:${email}`);
if (storedOtp === userInput) {
  await redis.del(`otp:${email}`); // Delete after verification
  // Proceed...
}
```

### 4. Leaderboard
```typescript
// Add score
await redis.zAdd('leaderboard', { 
  score: 1500, 
  value: 'user123' 
});

// Get top 10
const top10 = await redis.zRangeWithScores('leaderboard', 0, 9, {
  REV: true // Descending order
});

// Get user rank
const rank = await redis.zRevRank('leaderboard', 'user123');
```

## 🚀 Deployment Checklist

- [x] Redis package installed
- [x] Environment variables configured
- [x] Redis client utility created
- [x] Test endpoints working
- [ ] Add `REDIS_URL` to Vercel environment variables
- [ ] Push code to repository
- [ ] Deploy to Vercel

### Deploy Commands
```bash
# Add environment variable to Vercel
vercel env add REDIS_URL production

# Deploy
git add .
git commit -m "Add Redis integration"
git push

# Or use Vercel CLI
vercel --prod
```

## 📚 Resources

- **Setup Guide**: `REDIS_SETUP.md` - Comprehensive setup documentation
- **Integration Summary**: `REDIS_INTEGRATION_SUMMARY.md` - What was done
- **Redis Client**: `lib/redis.ts` - Main client utility
- **Test Endpoint**: `app/api/redis-test/route.ts` - Testing API
- **Cache Example**: `app/api/cache-example/route.ts` - Caching pattern

## ✅ Verified Working

✅ Connection successful  
✅ Read/Write operations functional  
✅ Expiration working  
✅ Delete operations working  
✅ Ready for production  

---

**Your Redis integration is complete and ready to use!** 🎉
