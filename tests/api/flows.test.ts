import { prisma } from '@/lib/prisma';
import { runSeed } from '@/prisma/seed';
import { callApi } from './utils';
import loginHandler from '@/pages/api/v1/auth/login';
import attendanceHandler from '@/pages/api/v1/sites/[siteId]/attendance/index';
import summaryHandler from '@/pages/api/v1/sites/[siteId]/wages/summary';
import voiceHandler from '@/pages/api/v1/sites/[siteId]/voice/index';
import transcribeHandler from '@/pages/api/v1/voice/[audioNoteId]/transcribe';
import toTasksHandler from '@/pages/api/v1/voice/[audioNoteId]/to-tasks';
import tasksHandler from '@/pages/api/v1/sites/[siteId]/tasks/index';
import savingsHandler from '@/pages/api/v1/sites/[siteId]/savings/index';
import dprSendHandler from '@/pages/api/v1/sites/[siteId]/dpr/send';
import dprAnswerHandler from '@/pages/api/v1/dpr/[promptId]/answer';
import drawingsHandler from '@/pages/api/v1/sites/[siteId]/drawings/index';
import drawingVersionsHandler from '@/pages/api/v1/drawings/[drawingId]/versions/index';
import drawingDiffHandler from '@/pages/api/v1/drawings/[drawingId]/diff/latest';

let sessionCookie: string;
let siteId: string;
let tradeId: string;
let drawingId: string;

beforeAll(async () => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret';
  await runSeed();
  const site = await prisma.site.findFirst();
  if (!site) throw new Error('Seed did not create site');
  siteId = site.id;
  const trade = await prisma.trade.findFirst();
  if (!trade) throw new Error('Seed did not create trade');
  tradeId = trade.id;
  const drawing = await prisma.drawing.findFirst({ where: { siteId } });
  if (!drawing) throw new Error('Seed did not create drawing');
  drawingId = drawing.id;
  const loginRes = await callApi(loginHandler, {
    method: 'POST',
    body: { email: 'engineer@demo.com', password: 'sitepulse123' },
    query: {},
    headers: {},
    cookies: {}
  });
  const rawCookie = loginRes.getHeader('Set-Cookie');
  if (!rawCookie) throw new Error('Login did not set cookie');
  const cookieString = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;
  sessionCookie = cookieString.split(';')[0].split('=')[1];
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Flow A: Attendance → Wages', () => {
  it('creates attendance and returns weekly summary', async () => {
    const postRes = await callApi(attendanceHandler, {
      method: 'POST',
      body: {
        entries: [
          {
            date: '2024-01-02',
            tradeId,
            headcount: 5
          }
        ]
      },
      query: { siteId },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(postRes.statusCode).toBe(201);

    const summaryRes = await callApi(summaryHandler, {
      method: 'GET',
      query: { siteId, week: '2024-01' },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    const summary = (summaryRes as any)._getJSONData();
    expect(summary.weeklyTotal).toBeGreaterThan(0);
  });
});

describe('Flow B: Voice → Tasks', () => {
  it('transcribes audio and creates a task', async () => {
    const voiceRes = await callApi(voiceHandler, {
      method: 'POST',
      body: {
        filePath: '/uploads/audio/test.mp3',
        storageProvider: 'local',
        mediaType: 'audio/mpeg'
      },
      query: { siteId },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(voiceRes.statusCode).toBe(201);
    const note = (voiceRes as any)._getJSONData();

    await callApi(transcribeHandler, {
      method: 'POST',
      query: { audioNoteId: note.id },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });

    const taskRes = await callApi(toTasksHandler, {
      method: 'POST',
      query: { audioNoteId: note.id },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(taskRes.statusCode).toBe(201);

    const listRes = await callApi(tasksHandler, {
      method: 'GET',
      query: { siteId },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    const tasks = (listRes as any)._getJSONData();
    expect(tasks.some((task: any) => task.audioNoteId === note.id)).toBe(true);
  });
});

describe('Flow C: Savings KPI', () => {
  it('returns savings snapshots for the site', async () => {
    const res = await callApi(savingsHandler, {
      method: 'GET',
      query: { siteId, period: 'week' },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(res.statusCode).toBe(200);
    const body = (res as any)._getJSONData();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});

describe('DPR prompt workflow', () => {
  it('sends a prompt and accepts an answer', async () => {
    const sendRes = await callApi(dprSendHandler, {
      method: 'POST',
      query: { siteId },
      body: { to: '919876543210' },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(sendRes.statusCode).toBe(201);
    const prompt = (sendRes as any)._getJSONData();

    const answerRes = await callApi(dprAnswerHandler, {
      method: 'POST',
      query: { promptId: prompt.id },
      body: { questionKey: 'progress_summary', answerText: 'Completed concreting.' },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(answerRes.statusCode).toBe(201);
  });
});

describe('Drawings API', () => {
  it('lists drawings, creates a new version, and fetches diff', async () => {
    const listRes = await callApi(drawingsHandler, {
      method: 'GET',
      query: { siteId },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(listRes.statusCode).toBe(200);
    const drawings = (listRes as any)._getJSONData();
    expect(drawings.length).toBeGreaterThan(0);

    const versionRes = await callApi(drawingVersionsHandler, {
      method: 'POST',
      query: { drawingId },
      body: {
        filePath: '/uploads/drawings/new-version.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 111111,
        checksum: 'new-checksum',
        storageProvider: 'local'
      },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(versionRes.statusCode).toBe(201);

    const diffRes = await callApi(drawingDiffHandler, {
      method: 'GET',
      query: { drawingId },
      headers: {},
      cookies: { sitepulse_session: sessionCookie }
    });
    expect(diffRes.statusCode).toBe(200);
    const diff = (diffRes as any)._getJSONData();
    expect(diff).toBeTruthy();
  });
});
