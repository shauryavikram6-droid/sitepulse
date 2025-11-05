import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureOrgAccess } from '@/lib/permissions';
import { requireAuth } from '@/lib/auth';
import { withMethods } from '@/lib/api';

const schema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  siteId: z.string().optional(),
  role: z.enum(['ADMIN', 'PM', 'ENGINEER'])
}).refine((data) => data.projectId || data.siteId, {
  message: 'projectId or siteId must be provided'
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) return;
  const { orgId } = req.query as { orgId: string };
  await ensureOrgAccess(session, orgId);
  const body = schema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: body.error.flatten() });
  }
  const assignment = await prisma.userAssignment.create({
    data: body.data
  });
  res.status(201).json(assignment);
}

export default withMethods(handler, ['POST']);
