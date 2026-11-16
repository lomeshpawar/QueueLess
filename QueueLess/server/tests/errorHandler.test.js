import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../utils/errorHandler.js';

function createResponse() {
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

test('returns a generic 500 response without exposing internal error details', t => {
  t.mock.method(console, 'error', () => {});
  const response = createResponse();

  errorHandler(new Error('database host and credentials must not be exposed'), {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: 'Internal server error.' });
  assert.equal(JSON.stringify(response.body).includes('credentials'), false);
});

test('preserves a valid client error status without exposing its internal message', t => {
  t.mock.method(console, 'error', () => {});
  const response = createResponse();

  errorHandler(Object.assign(new Error('private validation detail'), { status: 422 }), {}, response, () => {});

  assert.equal(response.statusCode, 422);
  assert.deepEqual(response.body, { message: 'The request could not be completed.' });
  assert.equal(JSON.stringify(response.body).includes('private validation detail'), false);
});

test('normalizes invalid error status values to 500', t => {
  t.mock.method(console, 'error', () => {});
  const response = createResponse();

  errorHandler(Object.assign(new Error('internal detail'), { status: 200 }), {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: 'Internal server error.' });
});
