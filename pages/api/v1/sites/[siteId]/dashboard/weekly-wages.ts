import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

function parseWeek(week?: string) {
  const now = new Date();
  if (!week) {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { start, end: now };
  }
  const [yearStr, weekStr] = week.split('-');
  const year = Number(yearStr);
  const weekNo = Number(weekStr);
  const first = new Date(year, 0, 1 + (weekNo - 1) * 7);
  const day = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - day + (day === 0 ? -6 : 1));
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
  const { start, end } = parseWeek(week);
  const entries = await prisma.attendanceEntry.findMany({
    where: { siteId, date: { gte: start, lte: end } }
  });
  const total = entries.reduce((sum, row) => sum + Number(row.total), 0);
  res.status(200).json({ start, end, total });
}
