import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { withMethods } from '@/lib/api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = schema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: body.error.flatten() });
  }
  const { email, password } = body.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  await createSession(res, user);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return res.status(200).json({ id: user.id, name: user.name, email: user.email, role: user.role });
}

export default withMethods(handler, ['POST']);
