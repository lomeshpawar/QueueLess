import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Staff from '../models/Staff.js';
const router = Router();
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const staff = await Staff.findOne({ email });
    if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const token = jwt.sign({ sub: staff._id.toString(), name: staff.name, email: staff.email }, process.env.JWT_SECRET || 'development-only-secret', { expiresIn: '8h' });
    res.json({ token, staff: { name: staff.name, email: staff.email } });
  } catch (error) { next(error); }
});
export default router;
