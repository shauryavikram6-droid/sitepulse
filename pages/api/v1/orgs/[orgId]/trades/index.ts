import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureOrgAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods, parsePagination } from '@/lib/api';

const createSchema = z.object({
  name: z.string()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { orgId } = req.query as { orgId: string };
  await ensureOrgAccess(session, orgId);

  if (req.method === 'GET') {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, trades] = await Promise.all([
      prisma.trade.count({ where: { orgId } }),
      prisma.trade.findMany({ where: { orgId }, skip, take: limit, orderBy: { createdAt: 'desc' } })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(trades);
  }

  if (req.method === 'POST') {
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.flatten() });
    }
    const trade = await prisma.trade.create({ data: { ...body.data, orgId } });
    return res.status(201).json(trade);
  }
}

export default withMethods(handler, ['GET', 'POST']);
