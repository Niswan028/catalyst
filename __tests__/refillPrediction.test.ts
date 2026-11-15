import { describe, it, expect } from 'vitest';
import { predictMedicationRefill, predictAllRefills } from '../lib/refillPrediction';
import { Medication } from '../lib/types';

describe('Medication Refill Predictions', () => {
  const baseMed: Medication = {
    id: 'med-aspirin',
    user_id: 'user-1',
    name: 'Aspirin',
    dosage: '81mg',
    time: '08:00',
    total_stock: 30,
    low_stock_threshold: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('calculates days of supply remaining accurately', () => {
    const fixedNow = new Date('2026-11-15T10:00:00Z');
    const prediction = predictMedicationRefill(baseMed, 1, fixedNow);

    expect(prediction.daysRemaining).toBe(30);
    expect(prediction.predictedRunOutDate).toBe('2026-12-15');
    expect(prediction.needsUrgentRefill).toBe(false);
    expect(prediction.isLowStock).toBe(false);
  });

  it('flags urgent refill when supply is 7 days or less', () => {
    const lowMed: Medication = {
      ...baseMed,
      total_stock: 5,
      low_stock_threshold: 5,
    };

    const fixedNow = new Date('2026-11-15T10:00:00Z');
    const prediction = predictMedicationRefill(lowMed, 1, fixedNow);

    expect(prediction.daysRemaining).toBe(5);
    expect(prediction.needsUrgentRefill).toBe(true);
    expect(prediction.isLowStock).toBe(true);
    expect(prediction.predictedRunOutDate).toBe('2026-11-20');
  });

  it('handles 0 stock safely without negative numbers', () => {
    const emptyMed: Medication = {
      ...baseMed,
      total_stock: 0,
    };

    const fixedNow = new Date('2026-11-15T10:00:00Z');
    const prediction = predictMedicationRefill(emptyMed, 1, fixedNow);

    expect(prediction.daysRemaining).toBe(0);
    expect(prediction.needsUrgentRefill).toBe(true);
    expect(prediction.predictedRunOutDate).toBe('2026-11-15');
  });

  it('sorts multiple medications by refill urgency', () => {
    const meds: Medication[] = [
      { ...baseMed, id: 'm1', name: 'M1', total_stock: 45 },
      { ...baseMed, id: 'm2', name: 'M2', total_stock: 3 },
      { ...baseMed, id: 'm3', name: 'M3', total_stock: 14 },
    ];

    const predictions = predictAllRefills(meds);
    expect(predictions[0].medicationName).toBe('M2'); // 3 days remaining
    expect(predictions[1].medicationName).toBe('M3'); // 14 days
    expect(predictions[2].medicationName).toBe('M1'); // 45 days
  });
});
