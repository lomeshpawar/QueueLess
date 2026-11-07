import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import Token from '../models/Token.js';
import tokenRoutes from '../routes/tokenRoutes.js';

const TEST_SECRET = 'queue-route-test-secret-with-at-least-32-characters';

function assertNoPrivateTokenFields(value) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoPrivateTokenFields(item);
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const privateField of ['visitorName', '_id', '__v']) {
    assert.equal(
      Object.hasOwn(value, privateField),
      false,
      `Public response must not contain ${privateField}`
    );
  }

  for (const child of Object.values(value)) {
    assertNoPrivateTokenFields(child);
  }
}

test('public token routes omit private fields and staff snapshot requires a valid JWT', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  const originalFind = Token.find;
  const originalFindOne = Token.findOne;
  const originalCountDocuments = Token.countDocuments;

  const fixture = [{
    _id: 'internal-mongo-id',
    __v: 0,
    tokenNumber: 'Q001',
    visitorName: 'Private Visitor',
    service: 'Accounts',
    status: 'waiting',
    createdAt: new Date('2026-11-06T10:00:00.000Z'),
    calledAt: new Date('2026-11-06T10:05:00.000Z'),
    completedAt: new Date('2026-11-06T10:10:00.000Z'),
    queueDate: '2026-11-06'
  }];

  let findCalls = 0;
  Token.find = () => {
    findCalls += 1;
    return {
      sort() { return this; },
      async lean() { return fixture; }
    };
  };
  Token.findOne = async query => query.status === 'serving'
    ? { status: 'serving', calledAt: null }
    : fixture[0];
  Token.countDocuments = async () => 1;

  const app = express();
  app.locals.averageServiceMinutes = 7.5;
  app.use('/api/tokens', tokenRoutes);
  const server = createServer(app);

  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api/tokens`;

    const publicSnapshotResponse = await fetch(baseUrl);
    assert.equal(publicSnapshotResponse.status, 200);
    const publicSnapshot = await publicSnapshotResponse.json();
    assertNoPrivateTokenFields(publicSnapshot);
    assert.equal(publicSnapshot.avgServiceMinutes, 7.5);

    const publicLookupResponse = await fetch(`${baseUrl}/mine/Q001`);
    assert.equal(publicLookupResponse.status, 200);
    const publicLookup = await publicLookupResponse.json();
    assertNoPrivateTokenFields(publicLookup);
    assert.equal(publicLookup.estimatedWaitMinutes, 15);

    const anonymousStaffResponse = await fetch(`${baseUrl}/staff`);
    assert.equal(anonymousStaffResponse.status, 401);

    const invalidTokenResponse = await fetch(`${baseUrl}/staff`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    assert.equal(invalidTokenResponse.status, 401);

    const staffToken = jwt.sign(
      { sub: 'staff-1', email: 'staff@example.com' },
      TEST_SECRET,
      { expiresIn: '5m' }
    );
    const staffResponse = await fetch(`${baseUrl}/staff`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.equal(staffResponse.status, 200);
    const staffSnapshot = await staffResponse.json();
    assert.equal(staffSnapshot.avgServiceMinutes, 7.5);
    assert.equal(staffSnapshot.tokens[0].visitorName, 'Private Visitor');
    assert.equal(staffSnapshot.tokens[0]._id, 'internal-mongo-id');

    const statsResponse = await fetch(`${baseUrl}/stats`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.equal(statsResponse.status, 200);
    const stats = await statsResponse.json();
    assert.equal(stats.avgServiceMinutes, 7.5);
    assert.ok(findCalls >= 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
    Token.find = originalFind;
    Token.findOne = originalFindOne;
    Token.countDocuments = originalCountDocuments;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
