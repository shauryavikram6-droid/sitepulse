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
  const entries = await prisma.attendanceEntry.findMany({
    where: { siteId },
    include: { trade: true },
    orderBy: { date: 'asc' }
  });
  const header = 'date,trade,headcount,rate,total\n';
  const body = entries
    .map((row) => `${row.date.toISOString().split('T')[0]},${row.trade.name},${row.headcount},${row.rateSnapshot},${row.total}`)
    .join('\n');
  const csv = header + body;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send(csv);
}
