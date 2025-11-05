import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Channel, NotificationStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const note = await prisma.notificationQueue.create({
    data: {
      siteId: null,
      userId: session.user.id,
      channel: Channel.CONSOLE,
      templateKey: 'test',
      payloadJson: { message: 'Test notification' },
      status: NotificationStatus.QUEUED,
      scheduledAt: new Date()
    }
  });
  res.status(201).json(note);
}
