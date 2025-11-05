import { NextApiRequest, NextApiResponse } from 'next';
import { clearSession, requireAuth } from '@/lib/auth';
import { withMethods } from '@/lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  clearSession(res);
  res.status(200).json({ message: 'Logged out' });
}

export default withMethods(handler, ['POST']);
