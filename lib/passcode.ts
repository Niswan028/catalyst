// Passcode generation, hashing, and verification using bcryptjs
import bcrypt from 'bcryptjs';

// Unambiguous characters for elderly and family ease of reading and typing
// Avoids 0/O, 1/I/L
const PASSCODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const SALT_ROUNDS = 10;

export interface InviteValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Generate a cryptographically strong, human-readable passcode (default: 6 characters, min 6, max 8)
 */
export function generatePasscode(length: number = 6): string {
  if (length < 6 || length > 8) {
    throw new Error('Passcode length must be between 6 and 8 characters');
  }

  let code = '';
  // Use crypto for high randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      code += PASSCODE_CHARS[randomBytes[i] % PASSCODE_CHARS.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * PASSCODE_CHARS.length);
      code += PASSCODE_CHARS[randomIndex];
    }
  }

  return code;
}

/**
 * Validate format of a raw passcode
 */
export function validatePasscodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();
  return trimmed.length >= 6 && trimmed.length <= 8 && /^[A-Z0-9]+$/.test(trimmed);
}

/**
 * Hash raw passcode before storing in database
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const normalized = passcode.trim().toUpperCase();
  return bcrypt.hash(normalized, SALT_ROUNDS);
}

/**
 * Verify raw passcode against stored bcrypt hash
 */
export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  if (!passcode || !hash) return false;
  const normalized = passcode.trim().toUpperCase();
  return bcrypt.compare(normalized, hash);
}

/**
 * Check if an invite code has expired
 */
export function isInviteExpired(expiresAt: string | Date): boolean {
  const expiry = new Date(expiresAt).getTime();
  return Date.now() > expiry;
}

/**
 * Check if an invite code is active, not revoked, not expired, and not over max uses
 */
export function isInviteValid(invite: {
  is_revoked: boolean;
  expires_at: string | Date;
  max_uses: number;
  uses_count: number;
}): InviteValidationResult {
  if (invite.is_revoked) {
    return { valid: false, reason: 'This invite passcode has been revoked.' };
  }

  if (isInviteExpired(invite.expires_at)) {
    return { valid: false, reason: 'This invite passcode has expired.' };
  }

  if (invite.max_uses > 0 && invite.uses_count >= invite.max_uses) {
    return { valid: false, reason: 'This invite passcode has reached its maximum usage limit.' };
  }

  return { valid: true };
}

/**
 * Calculate expiry date from hours (between 24h and 168h / 7d)
 */
export function calculateExpiryDate(hours: number = 48): Date {
  const boundedHours = Math.max(24, Math.min(168, hours));
  const date = new Date();
  date.setHours(date.getHours() + boundedHours);
  return date;
}
