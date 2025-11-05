import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { DPRStatus, Channel, NotificationStatus } from '@prisma/client';
import { sendWhatsAppMessage } from '@/lib/external';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { siteId } = req.query as { siteId: string };
  await ensureSiteAccess(session, siteId);
  const prompt = await prisma.dPRPrompt.create({
    data: { siteId, date: new Date(), status: DPRStatus.SENT }
  });
  await prisma.notificationQueue.create({
    data: {
      siteId,
      userId: session.user.id,
      channel: Channel.CONSOLE,
      templateKey: 'dpr-prompt',
      payloadJson: { promptId: prompt.id, message: 'DPR questions sent (stub).' },
      status: NotificationStatus.QUEUED,
      scheduledAt: new Date()
    }
  });
  if (req.body?.to) {
    await sendWhatsAppMessage({ to: req.body.to, message: 'DPR prompt dispatched.' });
  }
  res.status(201).json(prompt);
}
