/**
 * Centralized Date & Time formatting utilities for consistent UI presentation.
 */

import { format, isValid } from 'date-fns';

/**
 * Formats a Date object or ISO string safely into a readable date string.
 *
 * @param date - Date object or ISO date string
 * @param formatStr - date-fns format pattern (default: 'MMM dd, yyyy')
 * @returns Formatted date string or fallback on invalid input
 */
export function formatDate(date: Date | string | null | undefined, formatStr = 'MMM dd, yyyy'): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(d)) return 'Invalid date';
    return format(d, formatStr);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats a 24-hour time string ("14:30") into a 12-hour friendly string ("2:30 PM").
 *
 * @param timeStr - 24-hour time string in "HH:MM" format
 * @returns Friendly 12-hour string
 */
export function formatTime24to12(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Formats a Date object or ISO string into date and time ("Nov 15, 2026, 2:30 PM").
 *
 * @param date - Date object or ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'MMM dd, yyyy h:mm a');
}
