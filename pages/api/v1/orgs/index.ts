import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withMethods, parsePagination } from '@/lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { page, limit, skip } = parsePagination(req.query);
  const [total, organizations] = await Promise.all([
    prisma.organization.count({ where: { id: { in: session.orgIds } } }),
    prisma.organization.findMany({
      where: { id: { in: session.orgIds } },
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    })
  ]);
  res.setHeader('X-Total-Count', total.toString());
  res.status(200).json(organizations);
}

export default withMethods(handler, ['GET']);
