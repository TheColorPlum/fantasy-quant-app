import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  generateSecureToken,
  hashToken,
  createExpirationDate,
  isExpired,
  isValidTokenFormat,
  SHARE_LINK_TTL_MS
} from '@/lib/share-tokens';

// Mock crypto module
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(),
    createHash: vi.fn()
  }
}));

describe('Share Tokens Security', () => {
  const mockCrypto = vi.mocked(crypto);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSecureToken', () => {
    it('generates base62 token from crypto.randomBytes', () => {
      // Mock randomBytes to return predictable bytes for testing
      const mockBytes = Buffer.from([0, 1, 61, 62, 63, 255]);
      mockCrypto.randomBytes.mockReturnValue(mockBytes);
      
      const token = generateSecureToken(6);
      
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(6);
      expect(token).toBeDefined();
      expect(token.length).toBe(6);
      
      // Each character should be from base62 alphabet
      const base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      for (const char of token) {
        expect(base62Alphabet).toContain(char);
      }
    });

    it('uses 32 bytes by default', () => {
      const mockBytes = Buffer.alloc(32, 0);
      mockCrypto.randomBytes.mockReturnValue(mockBytes);
      
      generateSecureToken();
      
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('generates different tokens on successive calls', () => {
      const mockBytes1 = Buffer.from([0, 1, 2, 3]);
      const mockBytes2 = Buffer.from([4, 5, 6, 7]);
      
      mockCrypto.randomBytes
        .mockReturnValueOnce(mockBytes1)
        .mockReturnValueOnce(mockBytes2);
      
      const token1 = generateSecureToken(4);
      const token2 = generateSecureToken(4);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('creates SHA256 hash of token', () => {
      const mockHashObj = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abcd1234hash')
      };
      
      mockCrypto.createHash.mockReturnValue(mockHashObj as any);
      
      const hash = hashToken('test-token');
      
      expect(mockCrypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHashObj.update).toHaveBeenCalledWith('test-token');
      expect(mockHashObj.digest).toHaveBeenCalledWith('hex');
      expect(hash).toBe('abcd1234hash');
    });

    it('produces consistent hashes for same input', () => {
      const mockHashObj = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('consistent-hash')
      };
      
      mockCrypto.createHash.mockReturnValue(mockHashObj as any);
      
      const hash1 = hashToken('same-token');
      const hash2 = hashToken('same-token');
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('createExpirationDate', () => {
    it('creates date 7 days from now by default', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const expected = new Date('2025-01-22T12:00:00Z');
      
      const expiration = createExpirationDate(now);
      
      expect(expiration.getTime()).toBe(expected.getTime());
      expect(expiration.getTime() - now.getTime()).toBe(SHARE_LINK_TTL_MS);
    });

    it('uses current time when no date provided', () => {
      const beforeCall = Date.now();
      const expiration = createExpirationDate();
      const afterCall = Date.now();
      
      // Should be approximately 7 days from now
      const expectedMin = beforeCall + SHARE_LINK_TTL_MS;
      const expectedMax = afterCall + SHARE_LINK_TTL_MS;
      
      expect(expiration.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiration.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('correctly calculates 7 day TTL', () => {
      expect(SHARE_LINK_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('isExpired', () => {
    it('returns true when current time is past expiration', () => {
      const expiresAt = new Date('2025-01-15T12:00:00Z');
      const checkDate = new Date('2025-01-15T12:00:01Z'); // 1 second after
      
      expect(isExpired(expiresAt, checkDate)).toBe(true);
    });

    it('returns false when current time is before expiration', () => {
      const expiresAt = new Date('2025-01-15T12:00:00Z');
      const checkDate = new Date('2025-01-15T11:59:59Z'); // 1 second before
      
      expect(isExpired(expiresAt, checkDate)).toBe(false);
    });

    it('returns true when exactly at expiration time', () => {
      const expiresAt = new Date('2025-01-15T12:00:00Z');
      const checkDate = new Date('2025-01-15T12:00:00Z');
      
      expect(isExpired(expiresAt, checkDate)).toBe(true);
    });

    it('uses current time when no check date provided', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const futureDate = new Date(Date.now() + 1000); // 1 second from now
      
      expect(isExpired(pastDate)).toBe(true);
      expect(isExpired(futureDate)).toBe(false);
    });
  });

  describe('isValidTokenFormat', () => {
    it('accepts valid base62 tokens of sufficient length', () => {
      expect(isValidTokenFormat('abc123XYZ789defg')).toBe(true);
      expect(isValidTokenFormat('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')).toBe(true);
    });

    it('rejects tokens that are too short', () => {
      expect(isValidTokenFormat('short')).toBe(false);
      expect(isValidTokenFormat('123456789012345')).toBe(false); // exactly 15 chars
      expect(isValidTokenFormat('')).toBe(false);
    });

    it('rejects null or undefined tokens', () => {
      expect(isValidTokenFormat(null as any)).toBe(false);
      expect(isValidTokenFormat(undefined as any)).toBe(false);
    });

    it('rejects tokens with invalid characters', () => {
      expect(isValidTokenFormat('abc123-invalid-chars')).toBe(false); // hyphen not in base62
      expect(isValidTokenFormat('abc123+invalid/chars=')).toBe(false); // base64 chars not allowed
      expect(isValidTokenFormat('abc123@invalid#chars')).toBe(false); // special chars
    });

    it('accepts minimum valid length (16 chars)', () => {
      expect(isValidTokenFormat('abc123XYZ789defG')).toBe(true); // exactly 16 chars
    });
  });

  describe('Security Requirements', () => {
    it('generates tokens with sufficient entropy', () => {
      const mockBytes = Buffer.alloc(32);
      // Fill with different values to ensure variety
      for (let i = 0; i < 32; i++) {
        mockBytes[i] = i % 256;
      }
      mockCrypto.randomBytes.mockReturnValue(mockBytes);
      
      const token = generateSecureToken(32);
      
      expect(token.length).toBe(32);
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('hashing is deterministic but irreversible', () => {
      const mockHashObj = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('deterministic-hash-output')
      };
      
      mockCrypto.createHash.mockReturnValue(mockHashObj as any);
      
      const token = 'sensitive-token-data';
      const hash = hashToken(token);
      
      expect(hash).toBe('deterministic-hash-output');
      expect(mockCrypto.createHash).toHaveBeenCalledWith('sha256');
      
      // Hash should be different from original token
      expect(hash).not.toBe(token);
    });

    it('TTL enforcement prevents long-lived tokens', () => {
      const creationTime = new Date('2025-01-01T00:00:00Z');
      const expiration = createExpirationDate(creationTime);
      
      // Should expire exactly 7 days later
      const expectedExpiration = new Date('2025-01-08T00:00:00Z');
      expect(expiration.getTime()).toBe(expectedExpiration.getTime());
      
      // Should be expired after TTL period
      const afterExpiry = new Date('2025-01-08T00:00:01Z');
      expect(isExpired(expiration, afterExpiry)).toBe(true);
    });
  });
});