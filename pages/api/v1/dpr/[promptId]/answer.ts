import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureSiteAccess } from '@/lib/permissions';
import { DPRStatus } from '@prisma/client';

const schema = z.object({
  questionKey: z.string(),
  answerText: z.string(),
  numericValue: z.number().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { promptId } = req.query as { promptId: string };
  const prompt = await prisma.dPRPrompt.findUnique({ where: { id: promptId } });
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
  await ensureSiteAccess(session, prompt.siteId);
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const question = await prisma.dPRQuestionBank.findFirst({ where: { questionKey: body.data.questionKey } });
  if (!question) return res.status(404).json({ error: 'Question not found' });
  const answer = await prisma.dPRAnswer.create({
    data: {
      promptId,
      questionId: question.id,
      answerText: body.data.answerText,
      numericValue: body.data.numericValue ?? null
    }
  });
  await prisma.dPRPrompt.update({ where: { id: promptId }, data: { status: DPRStatus.ANSWERED } });
  res.status(201).json(answer);
}
