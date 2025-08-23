import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock database
vi.mock('@/lib/database', () => ({
  db: {
    $queryRaw: vi.fn()
  }
}));

import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status with ok, version, and dbMs', async () => {
      // Mock DB response time measurement  
      const { db } = await import('@/lib/database');
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ result: 1 }]);
      
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toMatchObject({
        ok: true,
        version: expect.any(String),
        dbMs: expect.any(Number)
      });
      expect(json.dbMs).toBeGreaterThanOrEqual(0); // Can be 0 for mocked calls
      expect(json.dbMs).toBeLessThan(1000); // Should be fast
    });

    it('should measure database response time accurately', async () => {
      // Mock a slower DB response
      const { db } = await import('@/lib/database');
      vi.mocked(db.$queryRaw).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve([{ result: 1 }]), 50))
      );

      const response = await GET();
      const json = await response.json();

      expect(json.dbMs).toBeGreaterThanOrEqual(45); // Allow some variance
      expect(json.dbMs).toBeLessThan(100);
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('@/lib/database');
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(new Error('Connection failed'));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(503);
      expect(json).toMatchObject({
        ok: false,
        error: 'Database connection failed'
      });
    });

    it('should include proper headers for monitoring', async () => {
      const { db } = await import('@/lib/database');
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ result: 1 }]);

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});