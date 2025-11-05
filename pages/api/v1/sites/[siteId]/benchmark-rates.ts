import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  itemCode: z.string(),
  rate: z.number(),
  currency: z.string(),
  effectiveFrom: z.string()
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
  const rate = await prisma.benchmarkRate.create({
    data: { siteId, itemCode: body.data.itemCode, rate: body.data.rate, currency: body.data.currency, effectiveFrom: new Date(body.data.effectiveFrom) }
  });
  res.status(201).json(rate);
}
