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
  const { month } = req.query as { month?: string };
  const targetMonth = month ? new Date(month) : new Date();
  const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  const snapshots = await prisma.savingsSnapshot.findMany({
    where: { siteId, period: 'MONTH', periodStart: { gte: start }, periodEnd: { lte: end } },
    orderBy: { periodStart: 'asc' }
  });
  const totalSaved = snapshots.reduce((sum, row) => sum + Number(row.saved), 0);
  res.status(200).json({ start, end, totalSaved, snapshots });
}
