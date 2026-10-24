import mongoose from 'mongoose';
import Token from './models/Token.js';
import { ACTIVE_SERVICES, HISTORICAL_SERVICES, ALL_SERVICES } from './utils/constants.js';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE SCENARIO TESTS ---\n');
  await mongoose.connect('mongodb://127.0.0.1:27017/queueless');
  const today = new Date().toISOString().slice(0, 10);

  // Clean today's tokens for a controlled test run
  await Token.deleteMany({ queueDate: today });
  console.log('Cleared existing tokens for today to ensure clean baseline.\n');

  // Login as staff
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@queueless.local', password: 'QueueLess@123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('Staff login failed: ' + JSON.stringify(loginData));
  const staffToken = loginData.token;
  console.log('Staff logged in successfully.\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${staffToken}`
  };

  // Helper to create token
  async function createToken(visitorName, service) {
    const res = await fetch(`${API_BASE}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorName, service })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }

  // Helper to track token
  async function trackToken(tokenNumber) {
    const res = await fetch(`${API_BASE}/tokens/mine/${tokenNumber}`);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }

  // Helper for staff actions
  async function staffAction(tokenId, action) {
    const res = await fetch(`${API_BASE}/tokens/${tokenId}/${action}`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }

  // Helper for call-next
  async function staffCallNext(service) {
    const res = await fetch(`${API_BASE}/tokens/call-next`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ service })
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }

  // SCENARIO 1: First token for Accounts
  console.log('Test Scenario 1: First token for Accounts: position 1, zero people ahead, zero waiting time if idle');
  const t1 = await createToken('Student 1 (Accounts)', 'Accounts');
  if (!t1.ok) throw new Error('Failed to create Accounts token: ' + JSON.stringify(t1.data));
  const track1 = await trackToken(t1.data.token.tokenNumber);
  console.log('  Accounts Token:', track1.data.token.tokenNumber);
  console.log('  Position:', track1.data.queuePosition, '| Ahead:', track1.data.peopleAhead, '| Wait:', track1.data.estimatedWaitMinutes);
  if (track1.data.queuePosition !== 1 || track1.data.peopleAhead !== 0 || track1.data.estimatedWaitMinutes !== 0) {
    throw new Error('Scenario 1 Failed: Expected pos 1, ahead 0, wait 0');
  }
  console.log('  PASSED\n');

  // SCENARIO 2: First token for College Canteen
  console.log('Test Scenario 2: First token for College Canteen: position 1, zero people ahead, zero waiting time if idle');
  const t2 = await createToken('Student 2 (Canteen)', 'College Canteen');
  if (!t2.ok) throw new Error('Failed to create Canteen token: ' + JSON.stringify(t2.data));
  const track2 = await trackToken(t2.data.token.tokenNumber);
  console.log('  Canteen Token:', track2.data.token.tokenNumber);
  console.log('  Position:', track2.data.queuePosition, '| Ahead:', track2.data.peopleAhead, '| Wait:', track2.data.estimatedWaitMinutes);
  if (track2.data.queuePosition !== 1 || track2.data.peopleAhead !== 0 || track2.data.estimatedWaitMinutes !== 0) {
    throw new Error('Scenario 2 Failed: Expected pos 1, ahead 0, wait 0');
  }
  console.log('  PASSED\n');

  // SCENARIO 3: One Accounts token and one College Canteen token: neither affects the other
  console.log('Test Scenario 3: Neither Accounts nor College Canteen affects the other\'s position or waiting time');
  const verify1 = await trackToken(t1.data.token.tokenNumber);
  const verify2 = await trackToken(t2.data.token.tokenNumber);
  console.log('  Accounts pos:', verify1.data.queuePosition, 'ahead:', verify1.data.peopleAhead, 'wait:', verify1.data.estimatedWaitMinutes);
  console.log('  Canteen pos:', verify2.data.queuePosition, 'ahead:', verify2.data.peopleAhead, 'wait:', verify2.data.estimatedWaitMinutes);
  if (verify1.data.queuePosition !== 1 || verify1.data.peopleAhead !== 0 || verify1.data.estimatedWaitMinutes !== 0 ||
      verify2.data.queuePosition !== 1 || verify2.data.peopleAhead !== 0 || verify2.data.estimatedWaitMinutes !== 0) {
    throw new Error('Scenario 3 Failed: Cross-service contamination detected');
  }
  console.log('  PASSED\n');

  // SCENARIO 4: Two waiting Accounts tokens: second token is behind first
  console.log('Test Scenario 4: Two waiting Accounts tokens: the second token is behind the first');
  const t3 = await createToken('Student 3 (Accounts)', 'Accounts');
  const track3 = await trackToken(t3.data.token.tokenNumber);
  console.log('  Second Accounts Token:', track3.data.token.tokenNumber);
  console.log('  Position:', track3.data.queuePosition, '| Ahead:', track3.data.peopleAhead, '| Wait:', track3.data.estimatedWaitMinutes);
  if (track3.data.queuePosition !== 2 || track3.data.peopleAhead !== 1 || track3.data.estimatedWaitMinutes <= 0) {
    throw new Error('Scenario 4 Failed: Expected pos 2, ahead 1, wait > 0');
  }
  console.log('  PASSED\n');

  // SCENARIO 5: A serving Accounts token and a waiting Accounts token
  console.log('Test Scenario 5: A serving Accounts token and a waiting Accounts token: waiting token accounts for active service');
  const callRes = await staffAction(t1.data.token._id, 'call');
  if (!callRes.ok) throw new Error('Failed to call Accounts token: ' + JSON.stringify(callRes.data));
  const track3AfterCall = await trackToken(t3.data.token.tokenNumber);
  console.log('  Waiting Accounts Token while 1 is serving:');
  console.log('  Position:', track3AfterCall.data.queuePosition, '| Ahead:', track3AfterCall.data.peopleAhead, '| Wait:', track3AfterCall.data.estimatedWaitMinutes);
  if (track3AfterCall.data.queuePosition !== 2 || track3AfterCall.data.peopleAhead !== 1 || track3AfterCall.data.estimatedWaitMinutes <= 0) {
    throw new Error('Scenario 5 Failed: Active serving token not accounted for');
  }
  console.log('  PASSED\n');

  // SCENARIO 6: A serving Accounts token and a waiting College Canteen token
  console.log('Test Scenario 6: A serving Accounts token and a waiting College Canteen token: canteen queue is unaffected');
  const track2WhileAccountsServing = await trackToken(t2.data.token.tokenNumber);
  console.log('  Canteen pos:', track2WhileAccountsServing.data.queuePosition, 'ahead:', track2WhileAccountsServing.data.peopleAhead, 'wait:', track2WhileAccountsServing.data.estimatedWaitMinutes);
  if (track2WhileAccountsServing.data.queuePosition !== 1 || track2WhileAccountsServing.data.peopleAhead !== 0 || track2WhileAccountsServing.data.estimatedWaitMinutes !== 0) {
    throw new Error('Scenario 6 Failed: Canteen queue contaminated by Accounts serving token');
  }
  console.log('  PASSED\n');

  // SCENARIO 7: Served and skipped tokens are not counted as waiting
  console.log('Test Scenario 7: Served and skipped tokens are not counted as waiting');
  // Mark t1 as served
  await staffAction(t1.data.token._id, 'serve');
  // Call t3 and skip it
  await staffAction(t3.data.token._id, 'call');
  await staffAction(t3.data.token._id, 'skip');
  // Also serve t2 (College Canteen) to ensure clean queues
  await staffAction(t2.data.token._id, 'call');
  await staffAction(t2.data.token._id, 'serve');

  // Check Accounts queue: should now be empty of waiting visitors
  const accountsSnapshot = await fetch(`${API_BASE}/tokens?service=Accounts`).then(r => r.json());
  console.log('  Accounts waiting count:', accountsSnapshot.waiting.length);
  if (accountsSnapshot.waiting.length !== 0) {
    throw new Error('Scenario 7 Failed: Served/skipped tokens included in waiting queue');
  }
  console.log('  PASSED\n');

  // SCENARIO 8: Each of the six services can generate and track tokens, and old services cannot be created
  console.log('Test Scenario 8: Each of the six services can generate and track tokens');
  const serviceTokens = {};
  for (const s of ACTIVE_SERVICES) {
    const res = await createToken(`Student for ${s}`, s);
    if (!res.ok) throw new Error(`Failed to create token for service ${s}: ` + JSON.stringify(res.data));
    const track = await trackToken(res.data.token.tokenNumber);
    if (track.data.token.service !== s || track.data.queuePosition !== 1) {
      throw new Error(`Failed tracking for service ${s}`);
    }
    serviceTokens[s] = res.data.token;
    console.log(`  Service [${s}]: Token ${res.data.token.tokenNumber} created & tracked successfully.`);
  }

  // Attempt to create token with old service
  const oldRes = await createToken('Invalid Student', 'Student Office');
  if (oldRes.ok || oldRes.status !== 400) {
    throw new Error('Scenario 8 Failed: Creation of old service token was not rejected with 400');
  }
  console.log('  Old service (Student Office) correctly rejected for new token creation (400 Bad Request).');
  console.log('  PASSED\n');

  // SCENARIO 9: Staff actions update only the selected service queue
  console.log('Test Scenario 9: Staff actions update only the selected service queue');
  // Call Idea Lab token
  const callIdeaLab = await staffCallNext('Idea Lab');
  if (!callIdeaLab.ok) throw new Error('Failed to call Idea Lab token: ' + JSON.stringify(callIdeaLab.data));
  console.log('  Idea Lab called:', callIdeaLab.data.token.tokenNumber);

  // Calling another Idea Lab token when one is serving must fail with 409
  const tIdeaLab2 = await createToken('Second Idea Lab', 'Idea Lab');
  const callIdeaLabConflict = await staffAction(tIdeaLab2.data.token._id, 'call');
  if (callIdeaLabConflict.status !== 409) {
    throw new Error('Scenario 9 Failed: Expected 409 Conflict when service is already serving a token');
  }
  console.log('  Concurrent call for same service rejected with 409 Conflict as expected.');

  // Calling Library token while Idea Lab is serving must SUCCEED
  const callLibrary = await staffCallNext('Library');
  if (!callLibrary.ok) throw new Error('Scenario 9 Failed: Library call was blocked by Idea Lab serving token');
  console.log('  Library called successfully while Idea Lab is serving:', callLibrary.data.token.tokenNumber);

  // Verify General Enquiry is still waiting and unaffected
  const geTrack = await trackToken(serviceTokens['General Enquiry'].tokenNumber);
  if (geTrack.data.token.status !== 'waiting' || geTrack.data.queuePosition !== 1) {
    throw new Error('Scenario 9 Failed: General Enquiry queue was affected by other services');
  }
  console.log('  General Enquiry remains undisturbed (pos 1, waiting).');
  console.log('  PASSED\n');

  // SCENARIO 10: Frontend, Backend, and MongoDB work together without breaking existing features
  console.log('Test Scenario 10: Full stack & historical compatibility verification');
  // Test historical record in MongoDB
  await Token.deleteMany({ tokenNumber: 'HIST-001', queueDate: '2026-01-01' });
  const historical = await Token.create({
    tokenNumber: 'HIST-001',
    visitorName: 'Historical Visitor',
    service: 'Student Office',
    status: 'served',
    queueDate: '2026-01-01'
  });
  const loadedHist = await Token.findById(historical._id);
  if (!loadedHist || loadedHist.service !== 'Student Office') {
    throw new Error('Scenario 10 Failed: Historical record broken');
  }
  console.log('  Historical token with "Student Office" preserved and readable in MongoDB.');

  // Verify public snapshot API
  const snapshotRes = await fetch(`${API_BASE}/tokens`);
  const snapshot = await snapshotRes.json();
  if (!snapshot.queueByService || !snapshot.servingByService || !snapshot.activeServices) {
    throw new Error('Scenario 10 Failed: Snapshot missing service breakdowns');
  }
  console.log('  Snapshot returns complete multi-service breakdown across all 6 services.');

  // Verify stats API
  const statsRes = await fetch(`${API_BASE}/tokens/stats`, { headers: authHeaders });
  const stats = await statsRes.json();
  if (!stats.byService || !stats.byService['Accounts']) {
    throw new Error('Scenario 10 Failed: Stats API missing byService breakdown');
  }
  console.log('  Stats API provides granular per-service metrics.');
  console.log('  PASSED\n');

  await mongoose.disconnect();
  console.log('====================================================');
  console.log('ALL 10 VERIFICATION SCENARIOS PASSED WITH ZERO ERRORS');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
