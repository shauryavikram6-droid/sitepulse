import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

export function withMethods(handler: NextApiHandler, methods: string[]): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!methods.includes(req.method || '')) {
      res.setHeader('Allow', methods);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Unexpected error' });
    }
  };
}

export function parsePagination(query: NextApiRequest['query']) {
  const page = Math.max(parseInt((query.page as string) || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt((query.limit as string) || '20', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}
