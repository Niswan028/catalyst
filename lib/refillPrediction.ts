// Medication refill predictor based on stock levels and daily dosage frequencies
import { Medication, RefillPrediction } from './types';
import { addDays, format } from 'date-fns';

/**
 * Predict refill requirements for a single medication
 */
export function predictMedicationRefill(
  medication: Medication,
  dailyDosageCount: number = 1,
  now: Date = new Date()
): RefillPrediction {
  const stock = Math.max(0, medication.total_stock || 0);
  const dailyCount = Math.max(1, dailyDosageCount);

  const daysRemaining = Math.floor(stock / dailyCount);
  const runOutDate = addDays(now, daysRemaining);

  const isLowStock = stock <= (medication.low_stock_threshold || 5);
  const needsUrgentRefill = daysRemaining <= 7;

  return {
    medicationId: medication.id,
    medicationName: medication.name,
    currentStock: stock,
    dailyDosageCount: dailyCount,
    daysRemaining,
    predictedRunOutDate: format(runOutDate, 'yyyy-MM-dd'),
    isLowStock,
    needsUrgentRefill,
  };
}

/**
 * Predict refill schedules across all active medications
 */
export function predictAllRefills(
  medications: Medication[],
  now: Date = new Date()
): RefillPrediction[] {
  return medications
    .filter((m) => m.is_active)
    .map((med) => predictMedicationRefill(med, 1, now))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
