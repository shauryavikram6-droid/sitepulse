import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { withMethods } from '@/lib/api';
import { TaskPriority } from '@prisma/client';

const schema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  title: z.string().optional(),
  description: z.string().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { taskId } = req.query as { taskId: string };
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  await ensureSiteAccess(session, task.siteId);

  if (req.method === 'PATCH') {
    const body = schema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: body.error.flatten() });
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...body.data,
        priority: body.data.priority ? (body.data.priority as TaskPriority) : undefined,
        dueDate: body.data.dueDate ? new Date(body.data.dueDate) : undefined
      }
    });
    return res.status(200).json(updated);
  }

  if (req.method === 'GET') {
    return res.status(200).json(task);
  }
}

export default withMethods(handler, ['GET', 'PATCH']);
