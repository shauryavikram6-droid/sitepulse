import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

function getWeekRange(week?: string) {
  if (!week) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start, end };
  }
  const [yearStr, weekStr] = week.split('-');
  const year = Number(yearStr);
  const weekNo = Number(weekStr);
  const simple = new Date(year, 0, 1 + (weekNo - 1) * 7);
  const dayOfWeek = simple.getDay();
  const start = new Date(simple);
  const diff = simple.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
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
  const { start, end } = getWeekRange(week);
  const entries = await prisma.attendanceEntry.findMany({
    where: { siteId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' }
  });
  const daily: Record<string, number> = {};
  let total = 0;
  for (const entry of entries) {
    const key = entry.date.toISOString().split('T')[0];
    daily[key] = (daily[key] || 0) + Number(entry.total);
    total += Number(entry.total);
  }
  res.status(200).json({ start, end, daily, weeklyTotal: total });
}
