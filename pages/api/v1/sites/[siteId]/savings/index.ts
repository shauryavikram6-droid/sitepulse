import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);
  const { period, from, to } = req.query as { period?: string; from?: string; to?: string };
  const where: any = { siteId };
  if (period) where.period = period.toUpperCase();
  if (from) where.periodStart = { gte: new Date(from) };
  if (to) where.periodEnd = { ...(where.periodEnd || {}), lte: new Date(to) };
  const snapshots = await prisma.savingsSnapshot.findMany({ where, orderBy: { periodStart: 'desc' } });
  res.status(200).json(snapshots);
}
