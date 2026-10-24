import { Router } from 'express';
import Token from '../models/Token.js';
import requireAuth from '../middleware/requireAuth.js';
import { ACTIVE_SERVICES, ALL_SERVICES, calculateEstimatedWaitMinutes } from '../utils/constants.js';

const router = Router();
const today = () => new Date().toISOString().slice(0, 10);
const avgMinutes = () => Math.max(1, Number(process.env.AVG_SERVICE_MINUTES || 5));

// Public snapshot used by visitor and queue-display pages.
router.get('/', async (req, res, next) => {
  try {
    const date = today();
    const serviceFilter = req.query.service;
    const tokens = await Token.find({ queueDate: date }).sort({ createdAt: 1 }).lean();

    // Group active queues per service
    const servingByService = {};
    const queueByService = {};
    for (const s of ACTIVE_SERVICES) {
      const sTokens = tokens.filter(t => t.service === s);
      const sServing = sTokens.find(t => t.status === 'serving') || null;
      const sWaiting = sTokens.filter(t => t.status === 'waiting');
      servingByService[s] = sServing;
      queueByService[s] = {
        waiting: sWaiting,
        serving: sServing,
        waitingCount: sWaiting.length
      };
    }

    const filteredTokens = (serviceFilter && ALL_SERVICES.includes(serviceFilter))
      ? tokens.filter(t => t.service === serviceFilter)
      : tokens;
    const waiting = filteredTokens.filter(t => t.status === 'waiting');
    const serving = (serviceFilter && ALL_SERVICES.includes(serviceFilter))
      ? (servingByService[serviceFilter] || null)
      : (tokens.find(t => t.status === 'serving') || null);

    res.json({
      tokens: filteredTokens,
      allTokens: tokens,
      waiting,
      serving,
      servingByService,
      queueByService,
      avgServiceMinutes: avgMinutes(),
      activeServices: ACTIVE_SERVICES
    });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const visitorName = String(req.body.visitorName || '').trim();
    const service = String(req.body.service || '').trim();

    if (visitorName.length < 2) {
      return res.status(400).json({ message: 'Enter a name with at least 2 characters.' });
    }
    if (!ACTIVE_SERVICES.includes(service)) {
      return res.status(400).json({ message: 'Choose a valid service.' });
    }

    const date = today();
    let count = await Token.countDocuments({ queueDate: date });
    let tokenNumber = `Q${String(count + 1).padStart(3, '0')}`;
    while (await Token.exists({ queueDate: date, tokenNumber })) {
      count += 1;
      tokenNumber = `Q${String(count + 1).padStart(3, '0')}`;
    }

    const token = await Token.create({ tokenNumber, visitorName, service, queueDate: date });

    // Calculate queue metrics specifically for this service
    const waitingAhead = await Token.countDocuments({
      queueDate: date,
      service: token.service,
      status: 'waiting',
      createdAt: { $lt: token.createdAt }
    });
    const servingToken = await Token.findOne({
      queueDate: date,
      service: token.service,
      status: 'serving'
    });

    const peopleAhead = (servingToken ? 1 : 0) + waitingAhead;
    const queuePosition = peopleAhead + 1;
    const estimatedWaitMinutes = calculateEstimatedWaitMinutes(waitingAhead, servingToken, avgMinutes());

    res.status(201).json({
      token,
      queuePosition,
      peopleAhead,
      estimatedWaitMinutes,
      message: 'Your token has been created.'
    });
  } catch (error) { next(error); }
});

router.get('/mine/:tokenNumber', async (req, res, next) => {
  try {
    const token = await Token.findOne({
      tokenNumber: req.params.tokenNumber.toUpperCase(),
      queueDate: today()
    });
    if (!token) return res.status(404).json({ message: 'Token not found for today.' });

    let peopleAhead = 0;
    let queuePosition = 0;
    let estimatedWaitMinutes = 0;

    if (token.status === 'waiting') {
      // Calculate exclusively for this token's service
      const waitingAhead = await Token.countDocuments({
        queueDate: today(),
        service: token.service,
        status: 'waiting',
        createdAt: { $lt: token.createdAt }
      });
      const servingToken = await Token.findOne({
        queueDate: today(),
        service: token.service,
        status: 'serving'
      });

      peopleAhead = (servingToken ? 1 : 0) + waitingAhead;
      queuePosition = peopleAhead + 1;
      estimatedWaitMinutes = calculateEstimatedWaitMinutes(waitingAhead, servingToken, avgMinutes());
    } else if (token.status === 'serving') {
      peopleAhead = 0;
      queuePosition = 1;
      estimatedWaitMinutes = 0;
    }

    res.json({
      token,
      service: token.service,
      peopleAhead,
      queuePosition,
      estimatedWaitMinutes
    });
  } catch (error) { next(error); }
});

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const tokens = await Token.find({ queueDate: today() }).lean();
    const serviceFilter = req.query.service;

    const byService = {};
    for (const s of ACTIVE_SERVICES) {
      const sTokens = tokens.filter(t => t.service === s);
      byService[s] = {
        total: sTokens.length,
        waiting: sTokens.filter(t => t.status === 'waiting').length,
        serving: sTokens.filter(t => t.status === 'serving').length,
        served: sTokens.filter(t => t.status === 'served').length,
        skipped: sTokens.filter(t => t.status === 'skipped').length
      };
    }

    const targetTokens = (serviceFilter && ALL_SERVICES.includes(serviceFilter))
      ? tokens.filter(t => t.service === serviceFilter)
      : tokens;

    res.json({
      total: targetTokens.length,
      waiting: targetTokens.filter(t => t.status === 'waiting').length,
      serving: targetTokens.filter(t => t.status === 'serving').length,
      served: targetTokens.filter(t => t.status === 'served').length,
      skipped: targetTokens.filter(t => t.status === 'skipped').length,
      avgServiceMinutes: avgMinutes(),
      byService
    });
  } catch (error) { next(error); }
});

router.post('/call-next', requireAuth, async (req, res, next) => {
  try {
    const service = req.body.service;
    if (!service || (!ACTIVE_SERVICES.includes(service) && !ALL_SERVICES.includes(service))) {
      return res.status(400).json({ message: 'Valid service is required to call next.' });
    }

    const current = await Token.findOne({ queueDate: today(), service, status: 'serving' });
    if (current) {
      return res.status(409).json({
        message: `${current.tokenNumber} is already being served for ${service}. Mark it served or skipped first.`
      });
    }

    const nextToken = await Token.findOne({ queueDate: today(), service, status: 'waiting' }).sort({ createdAt: 1 });
    if (!nextToken) {
      return res.status(404).json({ message: `No waiting visitors for ${service}.` });
    }

    nextToken.status = 'serving';
    nextToken.calledAt = new Date();
    await nextToken.save();

    res.json({ token: nextToken, message: `${nextToken.tokenNumber} is now being served for ${service}.` });
  } catch (error) { next(error); }
});

router.patch('/:id/call', requireAuth, async (req, res, next) => {
  try {
    const tokenToCall = await Token.findOne({ _id: req.params.id, queueDate: today(), status: 'waiting' });
    if (!tokenToCall) return res.status(404).json({ message: 'Waiting token not found.' });

    // Check if there is already a serving token for THIS service
    const current = await Token.findOne({ queueDate: today(), service: tokenToCall.service, status: 'serving' });
    if (current) {
      return res.status(409).json({
        message: `${current.tokenNumber} is already being served for ${tokenToCall.service}. Mark it served or skipped first.`
      });
    }

    tokenToCall.status = 'serving';
    tokenToCall.calledAt = new Date();
    await tokenToCall.save();

    res.json({ token: tokenToCall, message: `${tokenToCall.tokenNumber} is now being served.` });
  } catch (error) { next(error); }
});

router.patch('/:id/serve', requireAuth, async (req, res, next) => {
  try {
    const token = await Token.findOneAndUpdate(
      { _id: req.params.id, queueDate: today(), status: 'serving' },
      { status: 'served', completedAt: new Date() },
      { new: true }
    );
    if (!token) return res.status(404).json({ message: 'No active serving token found.' });
    res.json({ token, message: `${token.tokenNumber} marked as served.` });
  } catch (error) { next(error); }
});

router.patch('/:id/skip', requireAuth, async (req, res, next) => {
  try {
    const token = await Token.findOneAndUpdate(
      { _id: req.params.id, queueDate: today(), status: { $in: ['waiting', 'serving'] } },
      { status: 'skipped', completedAt: new Date() },
      { new: true }
    );
    if (!token) return res.status(404).json({ message: 'Token cannot be skipped.' });
    res.json({ token, message: `${token.tokenNumber} skipped.` });
  } catch (error) { next(error); }
});

router.patch('/:id/recall', requireAuth, async (req, res, next) => {
  try {
    const token = await Token.findOneAndUpdate(
      { _id: req.params.id, queueDate: today(), status: 'skipped' },
      { status: 'waiting', calledAt: null, completedAt: null },
      { new: true }
    );
    if (!token) return res.status(404).json({ message: 'Skipped token not found.' });
    res.json({ token, message: `${token.tokenNumber} returned to the queue.` });
  } catch (error) { next(error); }
});

export default router;
