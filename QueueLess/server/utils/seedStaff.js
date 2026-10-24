import bcrypt from 'bcryptjs';
import Staff from '../models/Staff.js';
export async function seedStaff() {
  const email = (process.env.STAFF_EMAIL || 'staff@queueless.local').toLowerCase();
  const existing = await Staff.findOne({ email });
  if (!existing) {
    const passwordHash = await bcrypt.hash(process.env.STAFF_PASSWORD || 'QueueLess@123', 12);
    await Staff.create({ name: process.env.STAFF_NAME || 'QueueLess Staff', email, passwordHash });
    console.log(`Created demo staff account: ${email}`);
  }
}
