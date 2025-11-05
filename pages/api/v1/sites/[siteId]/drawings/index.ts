import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods } from '@/lib/api';

const schema = z.object({
  title: z.string(),
  discipline: z.string()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'GET') {
    const drawings = await prisma.drawing.findMany({ where: { siteId }, include: { versions: true } });
    return res.status(200).json(drawings);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const drawing = await prisma.drawing.create({ data: { ...body.data, siteId } });
    return res.status(201).json(drawing);
  }
}

export default withMethods(handler, ['GET', 'POST']);
