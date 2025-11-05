import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods } from '@/lib/api';

const schema = z.object({
  filePath: z.string(),
  storageProvider: z.string(),
  mediaType: z.string(),
  durationSec: z.number().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const note = await prisma.audioNote.create({
      data: {
        siteId,
        uploadedById: session.user.id,
        ...body.data
      }
    });
    return res.status(201).json(note);
  }

  if (req.method === 'GET') {
    const notes = await prisma.audioNote.findMany({ where: { siteId }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json(notes);
  }
}

export default withMethods(handler, ['GET', 'POST']);
