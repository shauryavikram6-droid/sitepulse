import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods, parsePagination } from '@/lib/api';
import { TaskPriority, TaskSource, TaskStatus } from '@prisma/client';

const createSchema = z.object({
  title: z.string(),
  description: z.string(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);

  if (req.method === 'GET') {
    const { status, assigneeId } = req.query as { status?: string; assigneeId?: string };
    const { page, limit, skip } = parsePagination(req.query);
    const where: any = { siteId };
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: { assignee: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);
    res.setHeader('X-Total-Count', total.toString());
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const body = createSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const task = await prisma.task.create({
      data: {
        siteId,
        title: body.data.title,
        description: body.data.description,
        assigneeId: body.data.assigneeId,
        dueDate: body.data.dueDate ? new Date(body.data.dueDate) : undefined,
        priority: body.data.priority as TaskPriority,
        status: TaskStatus.OPEN,
        source: TaskSource.MANUAL,
        createdById: session.user.id
      }
    });
    return res.status(201).json(task);
  }
}

export default withMethods(handler, ['GET', 'POST']);
