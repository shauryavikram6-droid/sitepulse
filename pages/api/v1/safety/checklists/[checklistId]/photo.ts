import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';

const schema = z.object({
  filePath: z.string(),
  storageProvider: z.string(),
  mimeType: z.string(),
  checksum: z.string(),
  caption: z.string().optional(),
  takenAt: z.string().optional()
});

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
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const photo = await prisma.safetyPhoto.create({
    data: {
      checklistId,
      uploadedById: session.user.id,
      takenAt: body.data.takenAt ? new Date(body.data.takenAt) : undefined,
      ...body.data
    }
  });
  res.status(201).json(photo);
}
