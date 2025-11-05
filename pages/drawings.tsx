import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function DrawingsPage() {
  const { siteId } = useDemoSite();
  const { data: drawings } = useSWR(siteId ? `/api/v1/sites/${siteId}/drawings` : null, fetcher);

  return (
    <main className="container">
      <h1>Drawing Vault</h1>
      <div className="card">
        <ul>
          {drawings?.map((drawing: any) => (
            <li key={drawing.id}>
              {drawing.title} ({drawing.discipline}) – versions: {drawing.versions?.length}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
