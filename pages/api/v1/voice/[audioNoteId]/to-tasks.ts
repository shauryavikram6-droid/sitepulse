import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { TaskPriority, TaskSource, TaskStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { audioNoteId } = req.query as { audioNoteId: string };
  const note = await prisma.audioNote.findUnique({ where: { id: audioNoteId }, include: { site: true } });
  if (!note) return res.status(404).json({ error: 'Audio note not found' });
  const title = note.transcribedText?.slice(0, 60) || 'Voice generated task';
  const task = await prisma.task.create({
    data: {
      siteId: note.siteId,
      title,
      description: note.transcribedText || 'Generated from voice note',
      status: TaskStatus.OPEN,
      source: TaskSource.VOICE,
      priority: TaskPriority.MEDIUM,
      createdById: session.user.id,
      assigneeId: session.user.id,
      audioNoteId
    }
  });
  res.status(201).json(task);
}
