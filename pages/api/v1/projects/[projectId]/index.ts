import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { ensureProjectAccess } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withMethods } from '@/lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { projectId } = req.query as { projectId: string };
  await ensureProjectAccess(session, projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { sites: true }
  });
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(200).json(project);
}

export default withMethods(handler, ['GET']);
