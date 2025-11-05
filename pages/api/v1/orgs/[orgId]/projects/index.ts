import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureOrgAccess } from '@/lib/permissions';
import { requireAuth } from '@/lib/auth';
import { withMethods, parsePagination } from '@/lib/api';

const createSchema = z.object({
  name: z.string(),
  code: z.string(),
  location: z.string()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { orgId } = req.query as { orgId: string };
  await ensureOrgAccess(session, orgId);

  if (req.method === 'GET') {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, projects] = await Promise.all([
      prisma.project.count({ where: { orgId } }),
      prisma.project.findMany({ where: { orgId }, skip, take: limit, orderBy: { createdAt: 'desc' } })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(projects);
  }

  if (req.method === 'POST') {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.flatten() });
    }
    const project = await prisma.project.create({
      data: { ...body.data, orgId }
    });
    return res.status(201).json(project);
  }
}

export default withMethods(handler, ['GET', 'POST']);
