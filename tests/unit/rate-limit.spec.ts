import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAndIncrement, getRemainingRequests } from '@/lib/rate-limit';

// Mock the database
vi.mock('@/lib/database', () => ({
  db: {
    $transaction: vi.fn(),
    rateLimit: {
      deleteMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn()
    }
  }
}));

describe('Rate Limiting', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('checkAndIncrement', () => {
    it('allows request when under limit', async () => {
      // Mock transaction that returns 'ok'
      mockDb.$transaction.mockImplementation(async (callback) => {
        // Mock cleanup (deleteMany)
        mockDb.rateLimit.deleteMany.mockResolvedValue({ count: 0 });
        
        // Mock count check - under limit
        mockDb.rateLimit.count.mockResolvedValue(2);
        
        // Mock creation
        mockDb.rateLimit.create.mockResolvedValue({
          id: 'test-rate-limit',
          userId: 'user1',
          routeKey: 'test-route',
          windowStart: new Date(),
          count: 1
        });
        
        return await callback(mockDb);
      });

      const result = await checkAndIncrement('user1', 'test-route', 5, 60000);

      expect(result).toBe('ok');
      expect(mockDb.$transaction).toHaveBeenCalled();
    });

    it('blocks request when at limit', async () => {
      // Mock transaction that returns 'limited'
      mockDb.$transaction.mockImplementation(async (callback) => {
        // Mock cleanup
        mockDb.rateLimit.deleteMany.mockResolvedValue({ count: 1 });
        
        // Mock count check - at limit
        mockDb.rateLimit.count.mockResolvedValue(5);
        
        return await callback(mockDb);
      });

      const result = await checkAndIncrement('user1', 'test-route', 5, 60000);

      expect(result).toBe('limited');
      expect(mockDb.rateLimit.create).not.toHaveBeenCalled();
    });

    it('allows request on database error (fail-open)', async () => {
      mockDb.$transaction.mockRejectedValue(new Error('Database connection failed'));

      const result = await checkAndIncrement('user1', 'test-route', 5, 60000);

      expect(result).toBe('ok');
    });

    it('cleans up old rate limit entries', async () => {
      const windowMs = 60000;
      const expectedWindowStart = new Date(Date.now() - windowMs);

      mockDb.$transaction.mockImplementation(async (callback) => {
        mockDb.rateLimit.deleteMany.mockResolvedValue({ count: 3 });
        mockDb.rateLimit.count.mockResolvedValue(1);
        mockDb.rateLimit.create.mockResolvedValue({
          id: 'test-rate-limit',
          userId: 'user1',
          routeKey: 'test-route',
          windowStart: new Date(),
          count: 1
        });
        
        return await callback(mockDb);
      });

      await checkAndIncrement('user1', 'test-route', 5, windowMs);

      expect(mockDb.rateLimit.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          routeKey: 'test-route',
          windowStart: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('getRemainingRequests', () => {
    it('returns correct remaining count', async () => {
      mockDb.rateLimit.count.mockResolvedValue(3);

      const result = await getRemainingRequests('user1', 'test-route', 5, 60000);

      expect(result.remaining).toBe(2);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('returns 0 when at limit', async () => {
      mockDb.rateLimit.count.mockResolvedValue(5);

      const result = await getRemainingRequests('user1', 'test-route', 5, 60000);

      expect(result.remaining).toBe(0);
    });

    it('handles database errors gracefully', async () => {
      mockDb.rateLimit.count.mockRejectedValue(new Error('Database error'));

      const result = await getRemainingRequests('user1', 'test-route', 5, 60000);

      expect(result.remaining).toBe(5); // Returns full limit on error
    });
  });
});