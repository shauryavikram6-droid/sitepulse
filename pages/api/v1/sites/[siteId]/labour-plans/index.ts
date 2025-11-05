import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods } from '@/lib/api';

const schema = z.object({
  weekStart: z.string(),
  plannedCost: z.number(),
  currency: z.string(),
  notes: z.string().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'GET') {
    const { from, to } = req.query as { from?: string; to?: string };
    const where: any = { siteId };
    if (from) where.weekStart = { gte: new Date(from) };
    if (to) where.weekStart = { ...(where.weekStart || {}), lte: new Date(to) };
    const plans = await prisma.labourPlan.findMany({ where, orderBy: { weekStart: 'asc' } });
    return res.status(200).json(plans);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    try {
      const plan = await prisma.labourPlan.create({
        data: { ...body.data, siteId, weekStart: new Date(body.data.weekStart) }
      });
      return res.status(201).json(plan);
    } catch (error) {
      return res.status(409).json({ error: 'Plan already exists for this week' });
    }
  }
}

export default withMethods(handler, ['GET', 'POST']);
