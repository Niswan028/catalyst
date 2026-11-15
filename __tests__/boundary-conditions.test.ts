// Boundary conditions, edge cases, and permission denials
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateAdherenceMetrics } from '@/lib/adherence';
import { isInviteExpired, isInviteValid } from '@/lib/passcode';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, PASSCODE_RATE_LIMIT_CONFIG } from '@/lib/rateLimit';

describe('Adherence Boundary Conditions', () => {
  it('returns hasData: false and null percentages when zero active doses are scheduled (never 100%)', () => {
    const metrics = calculateAdherenceMetrics([], []);
    expect(metrics.hasData).toBe(false);
    expect(metrics.weeklyAdherenceRate).toBeNull();
    expect(metrics.monthlyAdherenceRate).toBeNull();
    expect(metrics.streakDays).toBe(0);
    expect(metrics.totalScheduledWeek).toBe(0);
  });

  it('calculates 100% adherence when all doses in the past 7 days are confirmed taken', () => {
    const now = new Date();
    const meds = [{ id: 'm1', name: 'Aspirin', time: '08:00', is_active: true }] as any[];
    // Generate 7 days of taken logs
    const logs = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      logs.push({
        id: `log-${i}`,
        medication_id: 'm1',
        status: 'taken',
        scheduled_time: d.toISOString(),
      });
    }

    const metrics = calculateAdherenceMetrics(meds, logs as any[], now);
    expect(metrics.hasData).toBe(true);
    expect(metrics.weeklyAdherenceRate).toBe(100);
    expect(metrics.totalTakenWeek).toBe(7);
  });

  it('calculates 0% adherence when all doses are missed or skipped', () => {
    const now = new Date();
    const meds = [{ id: 'm1', name: 'Aspirin', time: '08:00', is_active: true }] as any[];
    const logs = [{ id: 'log-1', medication_id: 'm1', status: 'skipped', scheduled_time: now.toISOString() }] as any[];

    const metrics = calculateAdherenceMetrics(meds, logs, now);
    expect(metrics.hasData).toBe(true);
    expect(metrics.weeklyAdherenceRate).toBe(0);
  });
});

describe('Passcode Expiry & Revocation Boundaries', () => {
  it('detects an expired passcode immediately after expiry timestamp', () => {
    const pastTime = new Date(Date.now() - 1000).toISOString();
    expect(isInviteExpired(pastTime)).toBe(true);

    const futureTime = new Date(Date.now() + 60000).toISOString();
    expect(isInviteExpired(futureTime)).toBe(false);
  });

  it('validates active invites and rejects revoked or expired invites', () => {
    const activeInvite = {
      is_revoked: false,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      max_uses: 1,
      uses_count: 0,
    };
    expect(isInviteValid(activeInvite).valid).toBe(true);

    const revokedInvite = { ...activeInvite, is_revoked: true };
    const revokedResult = isInviteValid(revokedInvite);
    expect(revokedResult.valid).toBe(false);
    expect(revokedResult.reason).toContain('revoked');

    const maxUsesInvite = { ...activeInvite, uses_count: 1 };
    const maxUsesResult = isInviteValid(maxUsesInvite);
    expect(maxUsesResult.valid).toBe(false);
    expect(maxUsesResult.reason).toContain('maximum usage');
  });
});

describe('Rate Limit Exact Boundary Conditions', () => {
  const testKey = 'boundary_test_ip_999';

  beforeEach(() => {
    resetRateLimit(testKey);
  });

  it('allows exactly 5 failed attempts and blocks on the 6th', () => {
    for (let i = 1; i <= 5; i++) {
      const check = checkRateLimit(testKey, PASSCODE_RATE_LIMIT_CONFIG);
      expect(check.allowed, `Attempt ${i} should be allowed`).toBe(true);
      recordFailedAttempt(testKey, PASSCODE_RATE_LIMIT_CONFIG);
    }

    const blockedCheck = checkRateLimit(testKey, PASSCODE_RATE_LIMIT_CONFIG);
    expect(blockedCheck.allowed).toBe(false);
    expect(blockedCheck.remainingAttempts).toBe(0);
    expect(blockedCheck.retryAfterSeconds).toBeGreaterThan(0);
  });
});
