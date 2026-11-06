import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import requireAuth from '../middleware/requireAuth.js';

const TEST_SECRET = 'test-only-secret-with-at-least-32-characters';

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function withJwtSecret(value, callback) {
  const previous = process.env.JWT_SECRET;
  if (value === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = value;
  try {
    callback();
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
}

test('fails closed when JWT_SECRET is missing', () => {
  withJwtSecret(undefined, () => {
    const req = { headers: { authorization: 'Bearer supplied-token' } };
    const res = responseRecorder();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 503);
    assert.equal(nextCalled, false);
  });
});

test('rejects a token signed with a different secret', () => {
  withJwtSecret(TEST_SECRET, () => {
    const req = {
      headers: { authorization: `Bearer ${jwt.sign({ sub: 'staff-1' }, 'wrong-secret')}` }
    };
    const res = responseRecorder();

    requireAuth(req, res, () => assert.fail('next must not be called'));

    assert.equal(res.statusCode, 401);
  });
});

test('accepts a valid staff token and calls next', () => {
  withJwtSecret(TEST_SECRET, () => {
    const token = jwt.sign({ sub: 'staff-1', email: 'staff@example.com' }, TEST_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = responseRecorder();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.staff.sub, 'staff-1');
  });
});
