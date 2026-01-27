import { createClient } from 'redis';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create a Redis client instance
 * This ensures we only have one Redis connection throughout the app
 */
export async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Reconnect after 500ms, max 10 retries
          if (retries > 10) {
            return new Error('Max retries reached');
          }
          return 500;
        }
      }
    });

    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    // Connect to Redis
    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Close the Redis connection
 * Call this when shutting down the application
 */
export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Helper function to execute Redis commands with error handling
 */
export async function executeRedisCommand<T>(
  command: (client: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  const client = await getRedisClient();
  return await command(client);
}
