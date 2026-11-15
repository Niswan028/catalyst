// Tests for automated email reminder schedulers and notification deduplication
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildIdempotencyKey,
  processUpcomingDoseReminders,
  processMissedDoseEscalations,
  processAppointmentReminders,
  runAllReminders,
} from '@/lib/email/reminderEngine';

vi.mock('@/lib/email/service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-123' }),
}));

describe('Email Notification Schedulers', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
  });

  it('builds a deterministic idempotency key', () => {
    const key = buildIdempotencyKey('upcoming_dose', 'med-123', '2026-11-15:08:00', 'USER@EXAMPLE.COM');
    expect(key).toBe('upcoming_dose:med-123:2026-11-15:08:00:user@example.com');
  });

  it('handles upcoming dose reminders when no matching medications exist', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const result = await processUpcomingDoseReminders(mockSupabase, new Date('2026-11-15T08:00:00.000Z'), 20);
    expect(result.sent).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles database error gracefully in upcoming dose reminders', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection failure' } }),
        }),
      }),
    });

    const result = await processUpcomingDoseReminders(mockSupabase, new Date(), 20);
    expect(result.sent).toBe(0);
    expect(result.errors).toContain('DB connection failure');
  });

  it('handles missed dose escalations with database error gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Table locked' } }),
      }),
    });

    const result = await processMissedDoseEscalations(mockSupabase, new Date());
    expect(result.stage1Sent).toBe(0);
    expect(result.stage2Sent).toBe(0);
    expect(result.errors).toContain('Table locked');
  });

  it('handles appointment reminders with database error gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Appointments error' } }),
      }),
    });

    const result = await processAppointmentReminders(mockSupabase, new Date());
    expect(result.sent24h).toBe(0);
    expect(result.sent2h).toBe(0);
    expect(result.errors).toContain('Appointments error');
  });

  it('runs all reminders simultaneously and aggregates report', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const report = await runAllReminders(mockSupabase, new Date());
    expect(report).toBeDefined();
    expect(typeof report.upcomingDoseSent).toBe('number');
    expect(typeof report.missedDoseLevel1Sent).toBe('number');
    expect(typeof report.missedDoseLevel2Sent).toBe('number');
    expect(typeof report.appointment24hSent).toBe('number');
    expect(typeof report.appointment2hSent).toBe('number');
    expect(Array.isArray(report.errors)).toBe(true);
  });
});
