import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { ProgressEstimator } from '@prisma/client';

const schema = z.object({
  filePath: z.string(),
  storageProvider: z.string(),
  mimeType: z.string(),
  checksum: z.string(),
  date: z.string(),
  percentComplete: z.number().optional(),
  estimator: z.enum(['AI', 'MANUAL']).optional(),
  estimatorVersion: z.string().optional()
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
  const photo = await prisma.progressPhoto.create({
    data: {
      siteId,
      uploaderId: session.user.id,
      date: new Date(body.data.date),
      percentComplete: body.data.percentComplete,
      estimator: body.data.estimator as ProgressEstimator | undefined,
      estimatorVersion: body.data.estimatorVersion,
      ...body.data
    }
  });
  res.status(201).json(photo);
}
