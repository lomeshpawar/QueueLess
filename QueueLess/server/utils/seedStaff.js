import bcrypt from 'bcryptjs';
import Staff from '../models/Staff.js';

export async function seedStaff(config) {
  if (!config?.staffEmail || !config?.staffPassword) {
    throw new Error('Validated staff bootstrap configuration is required.');
  }

  const existing = await Staff.findOne({ email: config.staffEmail });
  if (!existing) {
    const passwordHash = await bcrypt.hash(config.staffPassword, 12);
    await Staff.create({
      name: config.staffName,
      email: config.staffEmail,
      passwordHash
    });
    console.log('Created configured staff account.');
  }
}
