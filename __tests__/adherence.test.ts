import { describe, it, expect } from 'vitest';
import {
  calculateAdherenceMetrics,
  detectAdherencePatterns,
  generateAdherenceInsight,
  MEDICAL_DISCLAIMER,
} from '../lib/adherence';
import { Medication, MedicationLog } from '../lib/types';

describe('Adherence Metrics Calculations', () => {
  const dummyMeds: Medication[] = [
    {
      id: 'med-1',
      user_id: 'user-1',
      name: 'Aspirin',
      dosage: '81mg',
      time: '08:00',
      total_stock: 30,
      low_stock_threshold: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'med-2',
      user_id: 'user-1',
      name: 'Lisinopril',
      dosage: '10mg',
      time: '14:00',
      total_stock: 20,
      low_stock_threshold: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('returns "No data yet" and null adherence when there are zero scheduled doses (never 100%)', () => {
    const metrics = calculateAdherenceMetrics([], []);
    expect(metrics.hasData).toBe(false);
    expect(metrics.weeklyAdherenceRate).toBeNull();
    expect(metrics.monthlyAdherenceRate).toBeNull();

    const insight = generateAdherenceInsight([], []);
    expect(insight.hasData).toBe(false);
    expect(insight.adherenceRateDisplay).toBe('No data yet');
  });

  it('calculates 100% adherence when all doses are logged taken', () => {
    const logs: MedicationLog[] = [];
    const now = new Date();

    // 7 days x 2 medications = 14 doses taken
    for (let day = 0; day < 7; day++) {
      const d = new Date(now);
      d.setDate(d.getDate() - day);
      logs.push(
        {
          id: `log-1-${day}`,
          medication_id: 'med-1',
          user_id: 'user-1',
          status: 'taken',
          scheduled_time: d.toISOString(),
          logged_at: d.toISOString(),
        },
        {
          id: `log-2-${day}`,
          medication_id: 'med-2',
          user_id: 'user-1',
          status: 'taken',
          scheduled_time: d.toISOString(),
          logged_at: d.toISOString(),
        }
      );
    }

    const metrics = calculateAdherenceMetrics(dummyMeds, logs, now);
    expect(metrics.weeklyAdherenceRate).toBe(100);
    expect(metrics.streakDays).toBeGreaterThanOrEqual(7);
    expect(metrics.totalTakenWeek).toBe(14);
  });

  it('calculates partial adherence accurately when doses are skipped', () => {
    const logs: MedicationLog[] = [];
    const now = new Date();

    // 7 doses taken, 7 skipped
    for (let day = 0; day < 7; day++) {
      const d = new Date(now);
      d.setDate(d.getDate() - day);
      logs.push(
        {
          id: `log-1-${day}`,
          medication_id: 'med-1',
          user_id: 'user-1',
          status: 'taken',
          scheduled_time: d.toISOString(),
          logged_at: d.toISOString(),
        },
        {
          id: `log-2-${day}`,
          medication_id: 'med-2',
          user_id: 'user-1',
          status: 'skipped',
          scheduled_time: d.toISOString(),
          logged_at: d.toISOString(),
        }
      );
    }

    const metrics = calculateAdherenceMetrics(dummyMeds, logs, now);
    expect(metrics.weeklyAdherenceRate).toBe(50);
    expect(metrics.totalTakenWeek).toBe(7);
  });

  it('detects pattern when afternoon doses are frequently skipped', () => {
    const logs: MedicationLog[] = [];
    const now = new Date();

    // med-2 (14:00) skipped 4 times
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      logs.push({
        id: `skip-${i}`,
        medication_id: 'med-2',
        user_id: 'user-1',
        status: 'skipped',
        scheduled_time: d.toISOString(),
        logged_at: d.toISOString(),
      });
    }

    const patterns = detectAdherencePatterns(dummyMeds, logs);
    expect(patterns.length).toBeGreaterThan(0);
    const afternoonPattern = patterns.find((p) => p.timeSlot === '14:00');
    expect(afternoonPattern).toBeDefined();
    expect(afternoonPattern?.missedCount).toBe(4);
    expect(afternoonPattern?.suggestion).toContain('lunch');
  });

  it('always includes medical disclaimer in insights', () => {
    const insight = generateAdherenceInsight(dummyMeds, []);
    expect(insight.disclaimer).toBe(MEDICAL_DISCLAIMER);
    expect(insight.disclaimer).toContain('Not medical advice');
  });
});
