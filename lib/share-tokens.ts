/**
 * Share token security utilities for PR20
 * Provides cryptographically secure token generation, hashing, and validation
 */

import crypto from 'crypto';

// Base62 alphabet (0-9, A-Z, a-z)
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// 7 days TTL as specified in PR20
export const SHARE_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates a cryptographically secure base62 token
 * @param bytes Number of random bytes to generate (default: 32)
 * @returns Base62 encoded token
 */
export function generateSecureToken(bytes: number = 32): string {
  const randomBytes = crypto.randomBytes(bytes);
  let result = '';
  
  for (let i = 0; i < randomBytes.length; i++) {
    result += BASE62_ALPHABET[randomBytes[i] % BASE62_ALPHABET.length];
  }
  
  return result;
}

/**
 * Hashes a token using SHA256
 * @param token Raw token to hash
 * @returns SHA256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates expiration date for a share link
 * @param fromDate Starting date (defaults to now)
 * @returns Date that's 7 days from fromDate
 */
export function createExpirationDate(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + SHARE_LINK_TTL_MS);
}

/**
 * Checks if a share link has expired
 * @param expiresAt Expiration date
 * @param checkDate Date to check against (defaults to now)
 * @returns true if expired
 */
export function isExpired(expiresAt: Date, checkDate: Date = new Date()): boolean {
  return checkDate >= expiresAt;
}

/**
 * Validates token format (base62, minimum length)
 * @param token Token to validate
 * @returns true if valid format
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || token.length < 16) return false;
  
  // Check if all characters are in base62 alphabet
  return token.split('').every(char => BASE62_ALPHABET.includes(char));
}