import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods } from '@/lib/api';

const lineSchema = z.object({
  itemCode: z.string(),
  unit: z.string().optional(),
  qty: z.number(),
  rate: z.number(),
  taxJson: z.any().optional()
});

const schema = z.object({
  vendor: z.string(),
  amount: z.number(),
  currency: z.string(),
  estimateRef: z.string().optional(),
  lines: z.array(lineSchema)
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'GET') {
    const orders = await prisma.purchaseOrder.findMany({
      where: { siteId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(orders);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const order = await prisma.purchaseOrder.create({
      data: {
        siteId,
        vendor: body.data.vendor,
        amount: body.data.amount,
        currency: body.data.currency,
        estimateRef: body.data.estimateRef,
        lines: { create: body.data.lines }
      }
    });
    return res.status(201).json(order);
  }
}

export default withMethods(handler, ['GET', 'POST']);
