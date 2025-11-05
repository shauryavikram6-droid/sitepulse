import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { promptId } = req.query as { promptId: string };
  const prompt = await prisma.dPRPrompt.findUnique({
    where: { id: promptId },
    include: { answers: { include: { question: true } } }
  });
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
  await ensureSiteAccess(session, prompt.siteId);
  const summary = prompt.answers.map((a) => `${a.question.promptText}: ${a.answerText}`).join('\n');
  res.status(200).json({ promptId, summary });
}
