import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePagination } from '@/lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const { status, siteId, userId } = req.query as { status?: string; siteId?: string; userId?: string };
    const { page, limit, skip } = parsePagination(req.query);
    const where: any = {};
    if (status) where.status = status;
    if (siteId) where.siteId = siteId;
    if (userId) where.userId = userId;
    const [total, notifications] = await Promise.all([
      prisma.notificationQueue.count({ where }),
      prisma.notificationQueue.findMany({ where, orderBy: { scheduledAt: 'desc' }, skip, take: limit })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(notifications);
  }

  res.setHeader('Allow', 'GET');
  return res.status(405).json({ error: 'Method not allowed' });
}
