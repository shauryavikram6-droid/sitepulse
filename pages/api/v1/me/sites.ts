import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await requireAuth(req, res);
  if (!session) return;
  const assignments = await prisma.userAssignment.findMany({
    where: { userId: session.user.id },
    include: { site: true, project: true }
  });
  const sites = await prisma.site.findMany({
    where: { orgId: { in: session.orgIds } },
    take: 10
  });
  const combined = assignments
    .map((a) => a.site)
    .filter(Boolean)
    .concat(sites)
    .filter((site, index, arr) => site && arr.findIndex((s) => s?.id === site.id) === index);
  res.status(200).json(combined);
}
