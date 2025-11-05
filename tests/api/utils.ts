import { createRequest, createResponse } from 'node-mocks-http';
import type { NextApiHandler } from 'next';

export async function callApi(handler: NextApiHandler, options: { method: string; body?: any; query?: any; headers?: any; cookies?: Record<string, string> }) {
  const req = createRequest({
    method: options.method,
    body: options.body,
    query: options.query,
    headers: options.headers,
    cookies: options.cookies
  });
  const res = createResponse();
  await handler(req as any, res as any);
  return res;
}
