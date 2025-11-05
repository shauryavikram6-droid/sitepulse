import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { withMethods } from '@/lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  res.status(200).json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    orgIds: session.orgIds
  });
}

export default withMethods(handler, ['GET']);
