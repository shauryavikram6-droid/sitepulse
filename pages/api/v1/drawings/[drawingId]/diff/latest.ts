import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { drawingId } = req.query as { drawingId: string };
  const drawing = await prisma.drawing.findUnique({ where: { id: drawingId } });
  if (!drawing) return res.status(404).json({ error: 'Drawing not found' });
  await ensureSiteAccess(session, drawing.siteId);
  const diff = await prisma.drawingDiff.findFirst({
    where: { newVersion: { drawingId } },
    orderBy: { createdAt: 'desc' },
    include: { newVersion: true, oldVersion: true }
  });
  res.status(200).json(diff || { message: 'No diff available yet.' });
}
