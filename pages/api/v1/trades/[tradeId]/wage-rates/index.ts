import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureOrgAccess } from '@/lib/permissions';
import { withMethods } from '@/lib/api';

const schema = z.object({
  ratePerDay: z.number().positive(),
  currency: z.string(),
  effectiveFrom: z.string().transform((value) => new Date(value))
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { tradeId } = req.query as { tradeId: string };
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  await ensureOrgAccess(session, trade.orgId);

  if (req.method === 'GET') {
    const rates = await prisma.wageRate.findMany({
      where: { tradeId },
      orderBy: { effectiveFrom: 'desc' }
    });
    return res.status(200).json(rates);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.flatten() });
    }
    const overlap = await prisma.wageRate.findFirst({
      where: { tradeId, effectiveFrom: body.data.effectiveFrom }
    });
    if (overlap) {
      return res.status(409).json({ error: 'Rate already exists for this effective date' });
    }
    const rate = await prisma.wageRate.create({
      data: {
        tradeId,
        ratePerDay: body.data.ratePerDay,
        currency: body.data.currency,
        effectiveFrom: body.data.effectiveFrom
      }
    });
    return res.status(201).json(rate);
  }
}

export default withMethods(handler, ['GET', 'POST']);
