import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureOrgAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods, parsePagination } from '@/lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { orgId } = req.query as { orgId: string };
  await ensureOrgAccess(session, orgId);
  const { page, limit, skip } = parsePagination(req.query);
  const [total, users] = await Promise.all([
    prisma.userOrgRole.count({ where: { orgId } }),
    prisma.userOrgRole.findMany({
      where: { orgId },
      skip,
      take: limit,
      include: { user: true }
    })
  ]);
  res.setHeader('X-Total-Count', total.toString());
  res.status(200).json(users.map(({ user, role }) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role
  })));
}

export default withMethods(handler, ['GET']);
