export function assertScenarioDatabaseIsEmpty(todayTokenCount) {
  if (!Number.isSafeInteger(todayTokenCount) || todayTokenCount < 0) {
    throw new TypeError('Current-day token count must be a non-negative safe integer.');
  }

  if (todayTokenCount > 0) {
    throw new Error(
      `Scenario test database already contains ${todayTokenCount} token(s) for today. ` +
      'Refusing to delete existing records. Use a fresh disposable database ending in _test.'
    );
  }
}

export function getOwnedTokenCleanupFilter(tokenIds) {
  const ids = [...new Set(
    (Array.isArray(tokenIds) ? tokenIds : [])
      .filter(id => typeof id === 'string' && id.trim().length > 0)
      .map(id => id.trim())
  )];

  return ids.length ? { _id: { $in: ids } } : null;
}
