import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureProjectAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods, parsePagination } from '@/lib/api';

const createSchema = z.object({
  name: z.string()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { projectId } = req.query as { projectId: string };
  const project = await ensureProjectAccess(session, projectId);

  if (req.method === 'GET') {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, sites] = await Promise.all([
      prisma.site.count({ where: { projectId } }),
      prisma.site.findMany({ where: { projectId }, skip, take: limit, orderBy: { createdAt: 'desc' } })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(sites);
  }

  if (req.method === 'POST') {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.flatten() });
    }
    const site = await prisma.site.create({
      data: { ...body.data, projectId, orgId: project.orgId }
    });
    return res.status(201).json(site);
  }
}

export default withMethods(handler, ['GET', 'POST']);
