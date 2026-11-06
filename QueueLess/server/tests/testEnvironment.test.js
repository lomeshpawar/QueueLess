import test from 'node:test';
import assert from 'node:assert/strict';
import { getScenarioTestEnvironment } from '../utils/testEnvironment.js';

const baseEnvironment = {
  TEST_MONGODB_URI: 'mongodb://127.0.0.1:27017/queueless_test',
  TEST_STAFF_EMAIL: 'staff@example.com',
  TEST_STAFF_PASSWORD: 'test-only-password'
};

test('requires explicit scenario-test configuration', () => {
  assert.throws(
    () => getScenarioTestEnvironment({}),
    /TEST_MONGODB_URI.*TEST_STAFF_EMAIL.*TEST_STAFF_PASSWORD/
  );
});

test('rejects the normal development database', () => {
  assert.throws(
    () => getScenarioTestEnvironment({
      ...baseEnvironment,
      TEST_MONGODB_URI: 'mongodb://127.0.0.1:27017/queueless'
    }),
    /ends in _test/
  );
});

test('accepts a dedicated test database and normalizes values', () => {
  const config = getScenarioTestEnvironment(baseEnvironment);
  assert.equal(config.staffEmail, 'staff@example.com');
  assert.equal(config.mongoUri, baseEnvironment.TEST_MONGODB_URI);
  assert.equal(config.apiBase, 'http://localhost:5000/api');
});
