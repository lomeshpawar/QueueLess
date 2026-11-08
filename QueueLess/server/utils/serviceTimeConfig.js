const DEFAULT_AVERAGE_SERVICE_MINUTES = 5;

export function getAverageServiceMinutes(value = process.env.AVG_SERVICE_MINUTES) {
  if (value === undefined || String(value).trim() === '') {
    return DEFAULT_AVERAGE_SERVICE_MINUTES;
  }

  const minutes = Number(value);
  if (!Number.isFinite(minutes)) {
    throw new Error('AVG_SERVICE_MINUTES must be a finite number.');
  }

  // Preserve the existing one-minute minimum while rejecting NaN and Infinity.
  return Math.max(1, minutes);
}
