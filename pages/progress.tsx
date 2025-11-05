import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function ProgressPage() {
  const { siteId } = useDemoSite();
  const { data: photos } = useSWR(siteId ? `/api/v1/sites/${siteId}/progress` : null, fetcher);

  return (
    <main className="container">
      <h1>Progress Photos</h1>
      <div className="card">
        <ul>
          {photos?.map((photo: any) => (
            <li key={photo.id}>{photo.date?.substring(0, 10)} – {photo.percentComplete ?? 'NA'}% complete ({photo.aiLabel ?? 'Label pending'})</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
