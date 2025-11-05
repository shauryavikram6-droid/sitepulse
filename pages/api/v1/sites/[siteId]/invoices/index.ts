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
  taxJson: z.any().optional(),
  purchaseOrderId: z.string().optional()
});

const schema = z.object({
  vendor: z.string(),
  amount: z.number(),
  currency: z.string(),
  discount: z.number().optional(),
  estimateRef: z.string().optional(),
  date: z.string(),
  lines: z.array(lineSchema)
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'GET') {
    const invoices = await prisma.invoice.findMany({
      where: { siteId },
      include: { lines: true },
      orderBy: { date: 'desc' }
    });
    return res.status(200).json(invoices);
  }

  if (req.method === 'POST') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const invoice = await prisma.invoice.create({
      data: {
        siteId,
        vendor: body.data.vendor,
        amount: body.data.amount,
        currency: body.data.currency,
        discount: body.data.discount,
        estimateRef: body.data.estimateRef,
        date: new Date(body.data.date),
        lines: { create: body.data.lines }
      }
    });
    return res.status(201).json(invoice);
  }
}

export default withMethods(handler, ['GET', 'POST']);
