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
  const { from, to } = req.query as { from?: string; to?: string };
  const where: any = { siteId };
  if (from) where.date = { gte: new Date(from) };
  if (to) where.date = { ...(where.date || {}), lte: new Date(to) };
  const checklists = await prisma.safetyChecklist.findMany({
    where,
    include: { template: true, photos: true },
    orderBy: { date: 'desc' }
  });
  res.status(200).json(checklists);
}
