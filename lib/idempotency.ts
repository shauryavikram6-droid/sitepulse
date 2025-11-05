import { NextApiRequest } from 'next';

const usedKeys = new Set<string>();

export function assertIdempotency(req: NextApiRequest) {
  const key = req.headers['idempotency-key'];
  if (!key) return;
  const value = Array.isArray(key) ? key[0] : key;
  if (usedKeys.has(value)) {
    throw new Error('Duplicate request detected via Idempotency-Key');
  }
  usedKeys.add(value);
}
