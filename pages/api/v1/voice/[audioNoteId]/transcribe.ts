import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { transcribeAudioStub } from '@/lib/external';
import { OPENAI_API_KEY } from '@/lib/env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const { audioNoteId } = req.query as { audioNoteId: string };
  const note = await prisma.audioNote.findUnique({ where: { id: audioNoteId } });
  if (!note) return res.status(404).json({ error: 'Audio note not found' });
  const text = await transcribeAudioStub({ audioNoteId, filePath: note.filePath });
  await prisma.audioNote.update({
    where: { id: audioNoteId },
    data: {
      transcribedText: note.transcribedText || text,
      transcribedAt: new Date(),
      transcriptionProvider: OPENAI_API_KEY ? 'openai-stub' : 'mock-transcriber'
    }
  });
  res.status(200).json({ message: 'Transcription complete (stub)', audioNoteId });
}
