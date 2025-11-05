import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { withMethods, parsePagination } from '@/lib/api';

const schema = z.object({
  filePath: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  checksum: z.string(),
  storageProvider: z.string()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { drawingId } = req.query as { drawingId: string };
  const drawing = await prisma.drawing.findUnique({ where: { id: drawingId } });
  if (!drawing) return res.status(404).json({ error: 'Drawing not found' });
  await ensureSiteAccess(session, drawing.siteId);

  if (req.method === 'GET') {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, versions] = await Promise.all([
      prisma.drawingVersion.count({ where: { drawingId } }),
      prisma.drawingVersion.findMany({
        where: { drawingId },
        orderBy: { versionNo: 'desc' },
        skip,
        take: limit
      })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(versions);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const latest = await prisma.drawingVersion.findFirst({
      where: { drawingId },
      orderBy: { versionNo: 'desc' }
    });
    const versionNo = (latest?.versionNo || 0) + 1;
    const version = await prisma.drawingVersion.create({
      data: {
        drawingId,
        versionNo,
        uploadedById: session.user.id,
        ...body.data
      }
    });
    res.status(201).json(version);
  }
}

export default withMethods(handler, ['GET', 'POST']);
