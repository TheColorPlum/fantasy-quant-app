import { db } from './database';

/**
 * Database-based rate limiting using sliding window
 */
export async function checkAndIncrement(
  userId: string,
  routeKey: string,
  limit: number,
  windowMs: number
): Promise<'ok' | 'limited'> {
  const windowStart = new Date(Date.now() - windowMs);

  try {
    // Start a transaction to ensure atomicity
    return await db.$transaction(async (tx) => {
      // Clean up old entries first
      await tx.rateLimit.deleteMany({
        where: {
          userId,
          routeKey,
          windowStart: {
            lt: windowStart
          }
        }
      });

      // Count current requests in the window
      const currentCount = await tx.rateLimit.count({
        where: {
          userId,
          routeKey,
          windowStart: {
            gte: windowStart
          }
        }
      });

      // Check if limit exceeded
      if (currentCount >= limit) {
        return 'limited';
      }

      // Add new request
      await tx.rateLimit.create({
        data: {
          userId,
          routeKey,
          windowStart: new Date(),
          count: 1
        }
      });

      return 'ok';
    });
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request to prevent blocking users
    return 'ok';
  }
}

/**
 * Get remaining requests for a user/route
 */
export async function getRemainingRequests(
  userId: string,
  routeKey: string,
  limit: number,
  windowMs: number
): Promise<{ remaining: number; resetTime: Date }> {
  const windowStart = new Date(Date.now() - windowMs);

  try {
    const currentCount = await db.rateLimit.count({
      where: {
        userId,
        routeKey,
        windowStart: {
          gte: windowStart
        }
      }
    });

    const remaining = Math.max(0, limit - currentCount);
    const resetTime = new Date(Date.now() + windowMs);

    return { remaining, resetTime };
  } catch (error) {
    console.error('Failed to get remaining requests:', error);
    return { remaining: limit, resetTime: new Date() };
  }
}