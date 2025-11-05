import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { parsePagination } from '@/lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);
  const { from, to } = req.query as { from?: string; to?: string };
  const { page, limit, skip } = parsePagination(req.query);
  const where: any = { siteId };
  if (from) where.date = { gte: new Date(from) };
  if (to) where.date = { ...(where.date || {}), lte: new Date(to) };
  const [total, photos] = await Promise.all([
    prisma.progressPhoto.count({ where }),
    prisma.progressPhoto.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit
    })
  ]);
  res.setHeader('X-Total-Count', total.toString());
  res.status(200).json(photos);
}
