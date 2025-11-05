import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { SafetyChecklistStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { checklistId } = req.query as { checklistId: string };
  const checklist = await prisma.safetyChecklist.findUnique({ where: { id: checklistId } });
  if (!checklist) return res.status(404).json({ error: 'Checklist not found' });
  await ensureSiteAccess(session, checklist.siteId);
  const updated = await prisma.safetyChecklist.update({
    where: { id: checklistId },
    data: { status: SafetyChecklistStatus.COMPLETED, completedAt: new Date(), completedById: session.user.id }
  });
  res.status(200).json(updated);
}
