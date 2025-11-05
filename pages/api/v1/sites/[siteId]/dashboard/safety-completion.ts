import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { SafetyChecklistStatus } from '@prisma/client';

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
  const total = await prisma.safetyChecklist.count({ where });
  const completed = await prisma.safetyChecklist.count({
    where: { ...where, status: SafetyChecklistStatus.COMPLETED }
  });
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  res.status(200).json({ total, completed, completionRate });
}
