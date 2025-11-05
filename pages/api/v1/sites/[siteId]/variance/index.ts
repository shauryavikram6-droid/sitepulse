import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + diff);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);
  const { week } = req.query as { week?: string };
  const weekStart = week ? new Date(week) : getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const [plan, attendance] = await Promise.all([
    prisma.labourPlan.findUnique({ where: { siteId_weekStart: { siteId, weekStart } } }),
    prisma.attendanceEntry.findMany({
      where: { siteId, date: { gte: weekStart, lte: weekEnd } }
    })
  ]);

  const actual = attendance.reduce((sum, row) => sum + Number(row.total), 0);
  const planned = plan ? Number(plan.plannedCost) : 0;
  const variance = actual - planned;
  res.status(200).json({ weekStart, weekEnd, planned, actual, variance, currency: plan?.currency ?? 'INR' });
}
