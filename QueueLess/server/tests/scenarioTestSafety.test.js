import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertScenarioDatabaseIsEmpty,
  getOwnedTokenCleanupFilter
} from '../utils/scenarioTestSafety.js';

test('allows a scenario database with no current-day tokens', () => {
  assert.doesNotThrow(() => assertScenarioDatabaseIsEmpty(0));
});

test('refuses to run when current-day tokens already exist', () => {
  assert.throws(
    () => assertScenarioDatabaseIsEmpty(2),
    /Refusing to delete existing records/
  );
});

test('rejects invalid current-day token counts', () => {
  for (const value of [-1, 1.5, NaN, Infinity, '0']) {
    assert.throws(() => assertScenarioDatabaseIsEmpty(value), TypeError);
  }
});

test('builds cleanup filter from only unique, non-empty owned token IDs', () => {
  assert.deepEqual(
    getOwnedTokenCleanupFilter(['id-one', 'id-two', 'id-one', '', null, '  ']),
    { _id: { $in: ['id-one', 'id-two'] } }
  );
});

test('returns no cleanup filter when the run created no tokens', () => {
  assert.equal(getOwnedTokenCleanupFilter([]), null);
});
