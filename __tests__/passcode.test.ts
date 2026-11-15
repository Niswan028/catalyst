import { describe, it, expect } from 'vitest';
import {
  generatePasscode,
  validatePasscodeFormat,
  hashPasscode,
  verifyPasscode,
  isInviteExpired,
  isInviteValid,
  calculateExpiryDate,
} from '../lib/passcode';

describe('Passcode Generator and Validator', () => {
  it('generates a 6-character passcode by default', () => {
    const code = generatePasscode();
    expect(code).toHaveLength(6);
    expect(validatePasscodeFormat(code)).toBe(true);
  });

  it('generates an 8-character passcode when requested', () => {
    const code = generatePasscode(8);
    expect(code).toHaveLength(8);
    expect(validatePasscodeFormat(code)).toBe(true);
  });

  it('throws an error if length is below 6 or above 8', () => {
    expect(() => generatePasscode(5)).toThrow('Passcode length must be between 6 and 8');
    expect(() => generatePasscode(9)).toThrow('Passcode length must be between 6 and 8');
  });

  it('does not contain ambiguous characters (0, O, 1, I, L)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generatePasscode(8);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('validates passcode format correctly', () => {
    expect(validatePasscodeFormat('ABC123')).toBe(true);
    expect(validatePasscodeFormat('87654321')).toBe(true);
    expect(validatePasscodeFormat('12345')).toBe(false); // too short
    expect(validatePasscodeFormat('123456789')).toBe(false); // too long
    expect(validatePasscodeFormat('ABC-12')).toBe(false); // invalid special char
  });
});

describe('Passcode Hashing and Verification (bcrypt)', () => {
  it('hashes and correctly verifies a valid passcode', async () => {
    const raw = 'K7M9P2';
    const hash = await hashPasscode(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await verifyPasscode(raw, hash);
    expect(matches).toBe(true);
  });

  it('is case-insensitive for elderly user convenience', async () => {
    const raw = 'AbC89x';
    const hash = await hashPasscode(raw);

    const matchesUpper = await verifyPasscode('ABC89X', hash);
    const matchesLower = await verifyPasscode('abc89x', hash);

    expect(matchesUpper).toBe(true);
    expect(matchesLower).toBe(true);
  });

  it('rejects an incorrect passcode', async () => {
    const raw = 'K7M9P2';
    const hash = await hashPasscode(raw);

    const matches = await verifyPasscode('WRONG1', hash);
    expect(matches).toBe(false);
  });
});

describe('Invite Expiry and Validity Checks', () => {
  it('detects expired invites', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(isInviteExpired(pastDate)).toBe(true);

    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
    expect(isInviteExpired(futureDate)).toBe(false);
  });

  it('validates active invite accurately', () => {
    const validInvite = {
      is_revoked: false,
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      max_uses: 1,
      uses_count: 0,
    };
    expect(isInviteValid(validInvite).valid).toBe(true);
  });

  it('rejects revoked invite', () => {
    const revokedInvite = {
      is_revoked: true,
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      max_uses: 1,
      uses_count: 0,
    };
    const result = isInviteValid(revokedInvite);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('revoked');
  });

  it('rejects invite when max uses is reached', () => {
    const usedInvite = {
      is_revoked: false,
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      max_uses: 3,
      uses_count: 3,
    };
    const result = isInviteValid(usedInvite);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('maximum usage limit');
  });

  it('calculates bounded expiry dates between 24h and 168h', () => {
    const exp24 = calculateExpiryDate(10); // below min, should clamp to 24
    const diff24 = (exp24.getTime() - Date.now()) / (3600 * 1000);
    expect(Math.round(diff24)).toBe(24);

    const exp7d = calculateExpiryDate(300); // above max, should clamp to 168
    const diff7d = (exp7d.getTime() - Date.now()) / (3600 * 1000);
    expect(Math.round(diff7d)).toBe(168);
  });
});
