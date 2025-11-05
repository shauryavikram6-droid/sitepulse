import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const specPath = path.join(process.cwd(), 'openapi.json');
  const spec = fs.readFileSync(specPath, 'utf-8');
  if (req.headers.accept?.includes('application/json')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(spec);
  }
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <title>SitePulse API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        const spec = ${spec};
        window.onload = () => {
          SwaggerUIBundle({
            spec,
            dom_id: '#swagger-ui'
          });
        };
      </script>
    </body>
  </html>`;
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}
