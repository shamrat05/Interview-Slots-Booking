import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

/**
 * GET endpoint - Test Redis connection and retrieve a value
 */
export async function GET() {
    try {
        const redis = await getRedisClient();

        // Test: Get a value from Redis
        const result = await redis.get("test-item");

        return NextResponse.json({
            success: true,
            result,
            message: result ? 'Value retrieved successfully' : 'No value found for key "test-item"'
        }, { status: 200 });
    } catch (error) {
        console.error('Redis GET Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

/**
 * POST endpoint - Set a value in Redis
 */
export async function POST(request: Request) {
    try {
        const redis = await getRedisClient();

        // Parse request body
        const body = await request.json();
        const { key = "test-item", value } = body;

        if (!value) {
            return NextResponse.json({
                success: false,
                error: 'Value is required in request body'
            }, { status: 400 });
        }

        // Set value in Redis
        await redis.set(key, value);

        return NextResponse.json({
            success: true,
            message: `Value set successfully for key "${key}"`,
            data: { key, value }
        }, { status: 200 });
    } catch (error) {
        console.error('Redis POST Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

/**
 * DELETE endpoint - Delete a value from Redis
 */
export async function DELETE(request: Request) {
    try {
        const redis = await getRedisClient();

        // Parse request body to get the key to delete
        const body = await request.json();
        const { key = "test-item" } = body;

        // Delete the key
        const result = await redis.del(key);

        return NextResponse.json({
            success: true,
            message: result > 0 ? `Key "${key}" deleted successfully` : `Key "${key}" not found`,
            deleted: result > 0
        }, { status: 200 });
    } catch (error) {
        console.error('Redis DELETE Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
