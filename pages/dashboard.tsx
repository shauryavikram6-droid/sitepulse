import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : null);

export default function DashboardPage() {
  const { siteId } = useDemoSite();
  const { data: wages } = useSWR(siteId ? `/api/v1/sites/${siteId}/dashboard/weekly-wages` : null, fetcher);
  const { data: savings } = useSWR(siteId ? `/api/v1/sites/${siteId}/dashboard/monthly-savings` : null, fetcher);
  const { data: progress } = useSWR(siteId ? `/api/v1/sites/${siteId}/dashboard/progress-trend` : null, fetcher);
  const { data: safety } = useSWR(siteId ? `/api/v1/sites/${siteId}/dashboard/safety-completion` : null, fetcher);

  return (
    <main className="container">
      <h1>SitePulse Dashboard</h1>
      <p style={{ color: '#475569' }}>Demo data shown for seeded site.</p>
      <div className="card">
        <h2>Weekly Wages</h2>
        <p>Total: ₹{wages?.total?.toLocaleString?.() ?? 'loading...'}</p>
      </div>
      <div className="card">
        <h2>Monthly Savings</h2>
        <p>Saved: ₹{savings?.totalSaved?.toLocaleString?.() ?? 'loading...'}</p>
      </div>
      <div className="card">
        <h2>Progress Trend</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(progress?.points ?? [], null, 2)}</pre>
      </div>
      <div className="card">
        <h2>Safety Completion Rate</h2>
        <p>{safety?.completionRate ?? 0}% complete</p>
      </div>
    </main>
  );
}
