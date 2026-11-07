import test from 'node:test';
import assert from 'node:assert/strict';
import { toPublicToken } from '../utils/tokenDto.js';

test('public token DTO includes queue fields but excludes visitor and database details', () => {
  const createdAt = new Date('2026-11-06T10:00:00.000Z');
  const token = {
    _id: 'internal-mongo-id',
    __v: 0,
    tokenNumber: 'Q001',
    visitorName: 'Private Visitor',
    service: 'Accounts',
    status: 'waiting',
    createdAt,
    calledAt: null,
    completedAt: null,
    queueDate: '2026-11-06'
  };

  const result = toPublicToken(token);

  assert.deepEqual(result, {
    tokenNumber: 'Q001',
    service: 'Accounts',
    status: 'waiting',
    createdAt,
    calledAt: null,
    completedAt: null,
    queueDate: '2026-11-06'
  });
  assert.equal('visitorName' in result, false);
  assert.equal('_id' in result, false);
  assert.equal('__v' in result, false);
});

test('public token DTO supports Mongoose-like documents', () => {
  const token = {
    toObject: () => ({
      tokenNumber: 'Q002',
      visitorName: 'Private Visitor',
      service: 'Library',
      status: 'serving',
      createdAt: new Date('2026-11-06T10:05:00.000Z'),
      calledAt: new Date('2026-11-06T10:10:00.000Z'),
      completedAt: null,
      queueDate: '2026-11-06',
      _id: 'internal-mongo-id'
    })
  };

  const result = toPublicToken(token);
  assert.equal(result.tokenNumber, 'Q002');
  assert.equal(result.service, 'Library');
  assert.equal(result.status, 'serving');
  assert.equal('visitorName' in result, false);
  assert.equal('_id' in result, false);
});
