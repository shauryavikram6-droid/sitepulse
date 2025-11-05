import { SessionContext } from './auth';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

export async function ensureOrgAccess(session: SessionContext, orgId: string) {
  if (session.role === UserRole.ADMIN) return true;
  if (session.orgIds.includes(orgId)) return true;
  throw new Error('Forbidden: org access denied');
}

export async function ensureSiteAccess(session: SessionContext, siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { orgId: true, projectId: true }
  });
  if (!site) {
    throw new Error('Site not found');
  }
  if (session.role === UserRole.ADMIN) return site;
  if (!session.orgIds.includes(site.orgId)) {
    throw new Error('Forbidden: org access denied');
  }
  const assignment = await prisma.userAssignment.findFirst({
    where: {
      userId: session.user.id,
      OR: [{ siteId }, { projectId: site.projectId }]
    }
  });
  if (!assignment) {
    throw new Error('Forbidden: site access denied');
  }
  return site;
}

export async function ensureProjectAccess(session: SessionContext, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { orgId: true }
  });
  if (!project) {
    throw new Error('Project not found');
  }
  if (session.role === UserRole.ADMIN) return project;
  if (!session.orgIds.includes(project.orgId)) {
    throw new Error('Forbidden: org access denied');
  }
  const assignment = await prisma.userAssignment.findFirst({
    where: { userId: session.user.id, projectId }
  });
  if (!assignment) {
    throw new Error('Forbidden: project access denied');
  }
  return project;
}
