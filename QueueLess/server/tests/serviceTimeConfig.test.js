import test from 'node:test';
import assert from 'node:assert/strict';
import { getAverageServiceMinutes } from '../utils/serviceTimeConfig.js';

test('uses the documented default when the setting is missing or blank', () => {
  assert.equal(getAverageServiceMinutes(undefined), 5);
  assert.equal(getAverageServiceMinutes(''), 5);
  assert.equal(getAverageServiceMinutes('   '), 5);
});

test('accepts finite numeric values and preserves the one-minute minimum', () => {
  assert.equal(getAverageServiceMinutes('7'), 7);
  assert.equal(getAverageServiceMinutes('7.5'), 7.5);
  assert.equal(getAverageServiceMinutes('0.5'), 1);
  assert.equal(getAverageServiceMinutes('-2'), 1);
});

test('rejects non-numeric and non-finite configuration values', () => {
  for (const value of ['abc', 'NaN', 'Infinity', '-Infinity']) {
    assert.throws(
      () => getAverageServiceMinutes(value),
      /AVG_SERVICE_MINUTES must be a finite number/
    );
  }
});
