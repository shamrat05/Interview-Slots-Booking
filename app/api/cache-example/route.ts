import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

/**
 * Example API route showing how to use Redis for caching
 * 
 * This demonstrates caching slot data in Redis to improve performance
 */

export async function GET(request: Request) {
    try {
        const redis = await getRedisClient();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }

        // Check if data is cached
        const cacheKey = `slots:${date}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            console.log('✅ Cache HIT for date:', date);
            return NextResponse.json({
                source: 'cache',
                data: JSON.parse(cachedData as string)
            });
        }

        // Cache MISS - fetch fresh data
        console.log('❌ Cache MISS for date:', date);

        // Simulate fetching data (replace with your actual data fetching logic)
        const freshData = {
            date,
            slots: [
                { id: '1', time: '09:00-10:00', available: true },
                { id: '2', time: '10:00-11:00', available: false },
                { id: '3', time: '11:00-12:00', available: true }
            ],
            fetchedAt: new Date().toISOString()
        };

        // Store in cache with 5-minute expiration
        await redis.set(cacheKey, JSON.stringify(freshData), {
            EX: 300 // 5 minutes in seconds
        });

        return NextResponse.json({
            source: 'fresh',
            data: freshData
        });

    } catch (error) {
        console.error('Redis Cache Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch slots data' },
            { status: 500 }
        );
    }
}

/**
 * Clear cache for a specific date
 */
export async function DELETE(request: Request) {
    try {
        const redis = await getRedisClient();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }

        const cacheKey = `slots:${date}`;
        await redis.del(cacheKey);

        return NextResponse.json({
            message: `Cache cleared for date: ${date}`
        });

    } catch (error) {
        console.error('Redis Cache Clear Error:', error);
        return NextResponse.json(
            { error: 'Failed to clear cache' },
            { status: 500 }
        );
    }
}
