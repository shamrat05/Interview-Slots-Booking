/**
 * Formats a 24-hour time string (HH:mm) to a 12-hour AM/PM format.
 * Gracefully handles malformed input and midnight (24:00).
 */
export function formatTimeToAMPM(time24: string): string {
  if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) {
    return time24 || '';
  }

  const parts = time24.split(':');
  let hour = parseInt(parts[0], 10);
  let minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute)) {
    return time24;
  }

  // Handle 24:00 as midnight AM
  const period = (hour >= 12 && hour < 24) ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
}
