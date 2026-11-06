import test from 'node:test';
import assert from 'node:assert/strict';
import { getSecurityConfig } from '../utils/securityConfig.js';

const validEnvironment = {
  JWT_SECRET: 'a-unique-test-secret-with-more-than-32-characters',
  STAFF_EMAIL: 'Staff@Example.com',
  STAFF_PASSWORD: 'a-unique-test-password',
  STAFF_NAME: 'Test Staff'
};

test('rejects missing security configuration', () => {
  assert.throws(
    () => getSecurityConfig({}),
    /JWT_SECRET.*STAFF_EMAIL.*STAFF_PASSWORD/
  );
});

test('rejects placeholder or weak secrets and passwords', () => {
  assert.throws(
    () => getSecurityConfig({
      ...validEnvironment,
      JWT_SECRET: 'CHANGE_ME_TO_A_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS'
    }),
    /JWT_SECRET/
  );
  assert.throws(
    () => getSecurityConfig({
      ...validEnvironment,
      STAFF_PASSWORD: 'short'
    }),
    /STAFF_PASSWORD/
  );
});

test('normalizes staff email and returns validated configuration', () => {
  const config = getSecurityConfig(validEnvironment);
  assert.equal(config.staffEmail, 'staff@example.com');
  assert.equal(config.staffName, 'Test Staff');
  assert.equal(config.jwtSecret, validEnvironment.JWT_SECRET);
});
