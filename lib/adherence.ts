// Rule-based adherence insights and pattern detector
import { Medication, MedicationLog, AdherenceInsight, AdherencePattern } from './types';
import { format, subDays, startOfDay, endOfDay, isSameDay } from 'date-fns';

export const MEDICAL_DISCLAIMER =
  'Rule-based adherence insight only. Not medical advice. Always consult your doctor or licensed pharmacist before making any changes to your medication schedule.';

/**
 * Calculate weekly and monthly adherence percentages and streaks
 */
export function calculateAdherenceMetrics(
  medications: Medication[],
  logs: MedicationLog[],
  now: Date = new Date()
): {
  hasData: boolean;
  weeklyAdherenceRate: number | null;
  monthlyAdherenceRate: number | null;
  streakDays: number;
  totalScheduledWeek: number;
  totalTakenWeek: number;
  totalMissedWeek: number;
} {
  const activeMeds = medications.filter((m) => m.is_active);
  if (activeMeds.length === 0 || logs.length === 0) {
    return {
      hasData: false,
      weeklyAdherenceRate: null,
      monthlyAdherenceRate: null,
      streakDays: 0,
      totalScheduledWeek: 0,
      totalTakenWeek: 0,
      totalMissedWeek: 0,
    };
  }

  // 1. Weekly metrics (past 7 days)
  const weekStart = subDays(now, 6);
  let totalScheduledWeek = activeMeds.length * 7;
  let totalTakenWeek = 0;
  let totalMissedWeek = 0;

  // Filter logs in past 7 days
  const weekLogs = logs.filter((log) => {
    const logDate = new Date(log.scheduled_time || log.logged_at);
    return logDate >= startOfDay(weekStart) && logDate <= endOfDay(now);
  });

  weekLogs.forEach((log) => {
    if (log.status === 'taken') totalTakenWeek++;
    else if (log.status === 'skipped') totalMissedWeek++;
  });

  // Calculate missed for doses never logged in past days
  const unloggedMissed = Math.max(0, totalScheduledWeek - (totalTakenWeek + totalMissedWeek));
  totalMissedWeek += unloggedMissed;

  const weeklyAdherenceRate =
    totalScheduledWeek > 0
      ? Math.min(100, Math.round((totalTakenWeek / totalScheduledWeek) * 100))
      : 100;

  // 2. Monthly metrics (past 30 days)
  const monthStart = subDays(now, 29);
  const totalScheduledMonth = activeMeds.length * 30;
  let totalTakenMonth = 0;

  const monthLogs = logs.filter((log) => {
    const logDate = new Date(log.scheduled_time || log.logged_at);
    return logDate >= startOfDay(monthStart) && logDate <= endOfDay(now);
  });

  monthLogs.forEach((log) => {
    if (log.status === 'taken') totalTakenMonth++;
  });

  const monthlyAdherenceRate =
    totalScheduledMonth > 0
      ? Math.min(100, Math.round((totalTakenMonth / totalScheduledMonth) * 100))
      : 100;

  // 3. Day Streak: consecutive days where 100% of daily doses were taken
  let streakDays = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = subDays(now, i);
    // Find logs for checkDate
    const dayLogs = logs.filter((log) => {
      const logDate = new Date(log.scheduled_time || log.logged_at);
      return isSameDay(logDate, checkDate);
    });

    const takenCount = dayLogs.filter((l) => l.status === 'taken').length;
    // Today can count towards streak if at least one dose taken or all scheduled so far taken
    if (i === 0) {
      if (takenCount > 0) streakDays++;
    } else {
      if (takenCount >= activeMeds.length) {
        streakDays++;
      } else {
        break;
      }
    }
  }

  return {
    hasData: true,
    weeklyAdherenceRate,
    monthlyAdherenceRate,
    streakDays,
    totalScheduledWeek,
    totalTakenWeek,
    totalMissedWeek,
  };
}

/**
 * Detect patterns in missed doses by time-of-day slots
 */
export function detectAdherencePatterns(
  medications: Medication[],
  logs: MedicationLog[]
): AdherencePattern[] {
  const patterns: AdherencePattern[] = [];
  const activeMeds = medications.filter((m) => m.is_active);

  // Group medications by scheduled time
  const timeSlotMap = new Map<string, { totalScheduled: number; missedCount: number }>();

  activeMeds.forEach((med) => {
    const existing = timeSlotMap.get(med.time) || { totalScheduled: 0, missedCount: 0 };
    // Assuming past 14 days analysis
    existing.totalScheduled += 14;
    timeSlotMap.set(med.time, existing);
  });

  // Count missed or skipped logs in past 14 days
  const fourteenDaysAgo = subDays(new Date(), 14);
  logs
    .filter((l) => new Date(l.scheduled_time || l.logged_at) >= fourteenDaysAgo)
    .forEach((log) => {
      if (log.status === 'skipped') {
        const med = medications.find((m) => m.id === log.medication_id);
        if (med && timeSlotMap.has(med.time)) {
          const entry = timeSlotMap.get(med.time)!;
          entry.missedCount++;
        }
      }
    });

  timeSlotMap.forEach((data, timeSlot) => {
    const hour = Number(timeSlot.split(':')[0] ?? 0);
    const missedPercentage =
      data.totalScheduled > 0 ? Math.round((data.missedCount / data.totalScheduled) * 100) : 0;

    // If missed percentage is >= 25% or missedCount >= 3
    if (data.missedCount >= 3 || missedPercentage >= 25) {
      let suggestion = '';
      if (hour >= 5 && hour < 11) {
        suggestion = 'Morning doses are frequently missed. Consider placing medications next to your breakfast table or coffee maker.';
      } else if (hour >= 11 && hour < 16) {
        suggestion = 'Afternoon doses often get overlooked during daytime activities. Try setting an alarm or pairing it with your lunch.';
      } else if (hour >= 16 && hour < 21) {
        suggestion = 'Evening doses are frequently delayed. Pairing with dinner or evening news can help build an automatic routine.';
      } else {
        suggestion = 'Bedtime doses show inconsistency. Placing your pill organizer on your bedside table can provide a helpful visual prompt.';
      }

      patterns.push({
        timeSlot,
        missedCount: data.missedCount,
        totalScheduled: data.totalScheduled,
        missedPercentage,
        suggestion,
      });
    }
  });

  return patterns;
}

/**
 * Generate complete adherence insights
 */
export function generateAdherenceInsight(
  medications: Medication[],
  logs: MedicationLog[],
  now: Date = new Date()
): AdherenceInsight {
  const metrics = calculateAdherenceMetrics(medications, logs, now);
  const patterns = detectAdherencePatterns(medications, logs);

  return {
    hasData: metrics.hasData,
    adherenceRateDisplay:
      metrics.hasData && metrics.weeklyAdherenceRate !== null
        ? `${metrics.weeklyAdherenceRate}%`
        : 'No data yet',
    weeklyAdherenceRate: metrics.weeklyAdherenceRate,
    monthlyAdherenceRate: metrics.monthlyAdherenceRate,
    streakDays: metrics.streakDays,
    totalScheduled: metrics.totalScheduledWeek,
    totalTaken: metrics.totalTakenWeek,
    totalMissed: metrics.totalMissedWeek,
    patterns,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}
