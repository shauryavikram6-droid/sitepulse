import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { prisma } from './prisma';
import { User, UserRole } from '@prisma/client';
import { AUTH_SECRET } from './env';

const SESSION_COOKIE = 'sitepulse_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

type SessionPayload = {
  userId: string;
  orgIds: string[];
  role: UserRole;
};

export async function createSession(res: NextApiResponse, user: User) {
  const orgRoles = await prisma.userOrgRole.findMany({
    where: { userId: user.id },
    select: { orgId: true }
  });
  const payload: SessionPayload = {
    userId: user.id,
    orgIds: orgRoles.map((r) => r.orgId),
    role: user.role
  };
  const token = jwt.sign(payload, AUTH_SECRET, { expiresIn: SESSION_TTL_SECONDS });
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS
    })
  );
}

export function clearSession(res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
  );
}

export async function getSession(req: NextApiRequest) {
  const cookie = req.cookies[SESSION_COOKIE];
  if (!cookie) return null;
  try {
    const decoded = jwt.verify(cookie, AUTH_SECRET) as SessionPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) return null;
    return { user, orgIds: decoded.orgIds, role: decoded.role };
  } catch (err) {
    return null;
  }
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session;
}

export async function getUserForClientSide(): Promise<User | null> {
  return null;
}

export type SessionContext = {
  user: User;
  orgIds: string[];
  role: UserRole;
};
