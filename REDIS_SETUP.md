# Redis Setup Guide

This project uses Redis for persistent data storage, with support for both:
- **Direct Redis connection** using `node-redis`
- **Vercel KV** (which is a Redis-compatible storage service)

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Redis Direct Connection
REDIS_URL="redis://default:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT"

# Vercel KV (Alternative)
KV_REST_API_URL="https://YOUR_KV_URL"
KV_REST_API_TOKEN="YOUR_TOKEN"
```

### Current Setup

Your project is currently configured with:
- Redis URL: `redis://default:XTjs3lXaPhdShW0XAYQdhAkg6xIDfE5l@redis-14920.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14920`
- This is a Redis Labs (RedisCloud) instance

## Usage

### Using Direct Redis Connection

```typescript
import { getRedisClient } from '@/lib/redis';

// In your API route or server component
export async function POST() {
  const redis = await getRedisClient();
  
  // Set a value
  await redis.set('key', 'value');
  
  // Get a value
  const result = await redis.get('key');
  
  return NextResponse.json({ result });
}
```

### Using Vercel KV (Already implemented)

The project already uses `@vercel/kv` in `lib/slots.ts`:

```typescript
import { kv } from '@vercel/kv';

// Set a value
await kv.set('key', 'value');

// Get a value
const result = await kv.get('key');
```

## Testing Redis Connection

### 1. Test API Endpoint

A test endpoint has been created at `/api/redis-test` with the following operations:

#### GET - Retrieve a value
```bash
curl http://localhost:3000/api/redis-test
```

#### POST - Set a value
```bash
curl -X POST http://localhost:3000/api/redis-test \
  -H "Content-Type: application/json" \
  -d '{"key": "test-item", "value": "Hello Redis!"}'
```

#### DELETE - Delete a value
```bash
curl -X DELETE http://localhost:3000/api/redis-test \
  -H "Content-Type: application/json" \
  -d '{"key": "test-item"}'
```

### 2. Test in Browser

After starting your dev server (`npm run dev`), you can test in your browser:

1. **Set a value**: Open DevTools Console and run:
   ```javascript
   fetch('/api/redis-test', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ key: 'test', value: 'Hello World!' })
   }).then(r => r.json()).then(console.log)
   ```

2. **Get the value**:
   ```javascript
   fetch('/api/redis-test').then(r => r.json()).then(console.log)
   ```

3. **Delete the value**:
   ```javascript
   fetch('/api/redis-test', {
     method: 'DELETE',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ key: 'test' })
   }).then(r => r.json()).then(console.log)
   ```

## Deployment to Vercel

### Option 1: Using Vercel KV (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → KV
3. Vercel will automatically inject `KV_REST_API_URL` and `KV_REST_API_TOKEN`
4. Your existing code in `lib/slots.ts` will work automatically

### Option 2: Using External Redis (Current Setup)

1. Add your `REDIS_URL` to Vercel environment variables:
   ```bash
   vercel env add REDIS_URL
   ```
   
2. Paste your Redis URL when prompted

3. Pull the environment variables locally:
   ```bash
   vercel env pull .env.development.local
   ```

## Redis Client Features

The Redis client in `lib/redis.ts` includes:

- ✅ **Singleton pattern** - Only one connection throughout the app
- ✅ **Auto-reconnect** - Automatically reconnects on connection loss
- ✅ **Error handling** - Comprehensive error logging
- ✅ **Connection events** - Logs connection status
- ✅ **Helper functions** - Easy-to-use command execution

## Common Redis Commands

```typescript
const redis = await getRedisClient();

// Strings
await redis.set('key', 'value');
const value = await redis.get('key');

// With expiration (in seconds)
await redis.set('session', 'data', { EX: 3600 }); // Expires in 1 hour

// Hash
await redis.hSet('user:1', { name: 'John', age: '30' });
const user = await redis.hGetAll('user:1');

// Lists
await redis.lPush('queue', 'item1');
const item = await redis.rPop('queue');

// Sets
await redis.sAdd('tags', 'redis');
const tags = await redis.sMembers('tags');

// Delete
await redis.del('key');

// Check existence
const exists = await redis.exists('key');

// Get all keys (use carefully in production)
const keys = await redis.keys('*');
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check Redis URL format**:
   ```
   redis://[username]:[password]@[host]:[port]
   ```

2. **Verify Redis is accessible**:
   ```bash
   # Install redis-cli
   # On Windows with WSL or use online Redis CLI
   redis-cli -u "redis://default:PASSWORD@HOST:PORT" ping
   ```

3. **Check firewall/security groups**: Ensure your Redis instance allows connections from your IP

### Environment Variables Not Loading

1. Make sure `.env.local` is in the root directory
2. Restart your development server after changing env vars
3. Check that the file is not gitignored (`.env.local` should be in `.gitignore`)

### Vercel Deployment Issues

1. Ensure environment variables are set in Vercel dashboard
2. Redeploy after adding environment variables
3. Check deployment logs for specific errors

## Migration from @vercel/kv to node-redis

If you want to migrate your existing code from `@vercel/kv` to `node-redis`:

```typescript
// Before (using @vercel/kv)
import { kv } from '@vercel/kv';
await kv.set('key', 'value');

// After (using node-redis)
import { getRedisClient } from '@/lib/redis';
const redis = await getRedisClient();
await redis.set('key', 'value');
```

The API is very similar, making migration straightforward.

## Best Practices

1. **Use connection pooling**: The singleton pattern in `lib/redis.ts` handles this
2. **Set expiration on temporary data**: Always use `EX` option for session data
3. **Handle errors gracefully**: Always wrap Redis calls in try-catch
4. **Use appropriate data structures**: Choose the right Redis data type for your use case
5. **Monitor connection**: Check Redis logs in production for connection issues

## Resources

- [Redis Documentation](https://redis.io/docs/)
- [node-redis GitHub](https://github.com/redis/node-redis)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Redis Commands Reference](https://redis.io/commands/)
