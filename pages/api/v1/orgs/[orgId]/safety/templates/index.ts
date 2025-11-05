import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureOrgAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods } from '@/lib/api';

const schema = z.object({
  name: z.string(),
  items: z.array(z.string())
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { orgId } = req.query as { orgId: string };
  await ensureOrgAccess(session, orgId);

  if (req.method === 'GET') {
    const templates = await prisma.safetyTemplate.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json(templates);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const template = await prisma.safetyTemplate.create({
      data: { orgId, name: body.data.name, itemsJson: { items: body.data.items } }
    });
    return res.status(201).json(template);
  }
}

export default withMethods(handler, ['GET', 'POST']);
