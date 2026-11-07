import test from 'node:test';
import assert from 'node:assert/strict';
import { getMongoUri } from '../utils/mongoConfig.js';

test('requires an explicit MongoDB URI', () => {
  assert.throws(() => getMongoUri({}), /MONGODB_URI is required/);
  assert.throws(() => getMongoUri({ MONGODB_URI: '   ' }), /MONGODB_URI is required/);
});

test('rejects malformed or unsupported database URIs', () => {
  assert.throws(
    () => getMongoUri({ MONGODB_URI: 'https://example.com/queueless' }),
    /mongodb:\/\/ or mongodb\+srv:\//
  );
  assert.throws(
    () => getMongoUri({ MONGODB_URI: 'mongodb://' }),
    /include a host/
  );
});

test('accepts local and hosted MongoDB connection URIs', () => {
  const localUri = 'mongodb://127.0.0.1:27017/queueless';
  const hostedUri = 'mongodb+srv://cluster.example.mongodb.net/queueless';

  assert.equal(getMongoUri({ MONGODB_URI: localUri }), localUri);
  assert.equal(getMongoUri({ MONGODB_URI: hostedUri }), hostedUri);
});
