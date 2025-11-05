import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods, parsePagination } from '@/lib/api';
import { assertIdempotency } from '@/lib/idempotency';
import { RateSource } from '@prisma/client';

const entrySchema = z.object({
  date: z.string(),
  tradeId: z.string(),
  headcount: z.number().nonnegative(),
  rateSnapshot: z.number().optional(),
  rateSource: z.enum(['TABLE', 'OVERRIDE']).optional(),
  overtimeHours: z.number().optional()
});

const createSchema = z.object({
  entries: z.array(entrySchema)
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'GET') {
    const { from, to } = req.query as { from?: string; to?: string };
    const { page, limit, skip } = parsePagination(req.query);
    const where: any = { siteId };
    if (from) where.date = { gte: new Date(from) };
    if (to) where.date = { ...(where.date || {}), lte: new Date(to) };
    const [total, rows] = await Promise.all([
      prisma.attendanceEntry.count({ where }),
      prisma.attendanceEntry.findMany({
        where,
        include: { trade: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    assertIdempotency(req);
    const body = createSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.flatten() });
    }
    const created = [];
    for (const item of body.data.entries) {
      const date = new Date(item.date);
      const existing = await prisma.attendanceEntry.findUnique({
        where: {
          siteId_date_tradeId: {
            siteId,
            date,
            tradeId: item.tradeId
          }
        }
      });
      if (existing) {
        await prisma.attendanceEntry.delete({ where: { id: existing.id } });
      }
      let rateSnapshot = item.rateSnapshot;
      let rateSource = item.rateSource || RateSource.TABLE;
      let wageRateId: string | undefined;
      if (!rateSnapshot || item.rateSource === 'TABLE') {
        const rate = await prisma.wageRate.findFirst({
          where: { tradeId: item.tradeId, effectiveFrom: { lte: date } },
          orderBy: { effectiveFrom: 'desc' }
        });
        if (rate) {
          rateSnapshot = Number(rate.ratePerDay);
          wageRateId = rate.id;
        } else if (!rateSnapshot) {
          throw new Error('No wage rate configured for trade');
        }
      } else {
        rateSource = RateSource.OVERRIDE;
      }
      const total = (rateSnapshot || 0) * item.headcount;
      const createdEntry = await prisma.attendanceEntry.create({
        data: {
          siteId,
          date,
          tradeId: item.tradeId,
          headcount: item.headcount,
          rateSnapshot: rateSnapshot || 0,
          rateSource,
          overtimeHours: item.overtimeHours,
          total,
          wageRateId
        }
      });
      created.push(createdEntry);
    }
    return res.status(201).json(created);
  }
}

export default withMethods(handler, ['GET', 'POST']);
