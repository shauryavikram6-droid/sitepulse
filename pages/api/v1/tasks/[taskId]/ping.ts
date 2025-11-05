import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { TaskFollowUpStatus, Channel, NotificationStatus } from '@prisma/client';
import { sendEmail } from '@/lib/external';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { taskId } = req.query as { taskId: string };
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  await ensureSiteAccess(session, task.siteId);
  const followUp = await prisma.taskFollowUp.create({
    data: { taskId, status: TaskFollowUpStatus.SENT }
  });
  await prisma.notificationQueue.create({
    data: {
      siteId: task.siteId,
      userId: task.assigneeId ?? session.user.id,
      channel: Channel.CONSOLE,
      templateKey: 'task-follow-up',
      payloadJson: { taskId, message: 'Reminder sent from SitePulse' },
      status: NotificationStatus.QUEUED,
      scheduledAt: new Date()
    }
  });
  if (task.assigneeId) {
    await sendEmail({
      to: `${task.assigneeId}@example.test`,
      subject: 'Task follow-up',
      html: `<p>Reminder triggered for task ${task.id}</p>`
    });
  }
  res.status(201).json(followUp);
}
