import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { SafetyChecklistStatus } from '@prisma/client';

const schema = z.object({
  templateId: z.string(),
  date: z.string(),
  notes: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const checklist = await prisma.safetyChecklist.create({
    data: {
      siteId,
      templateId: body.data.templateId,
      date: new Date(body.data.date),
      notes: body.data.notes,
      status: SafetyChecklistStatus.DRAFT
    }
  });
  res.status(201).json(checklist);
}
