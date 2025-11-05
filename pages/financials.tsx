import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function FinancialsPage() {
  const { siteId } = useDemoSite();
  const { data: pos } = useSWR(siteId ? `/api/v1/sites/${siteId}/purchase-orders` : null, fetcher);
  const { data: invoices } = useSWR(siteId ? `/api/v1/sites/${siteId}/invoices` : null, fetcher);
  const { data: savings } = useSWR(siteId ? `/api/v1/sites/${siteId}/savings` : null, fetcher);

  return (
    <main className="container">
      <h1>Bills & Savings</h1>
      <div className="card">
        <h2>Purchase Orders</h2>
        <ul>
          {pos?.map((po: any) => (
            <li key={po.id}>{po.vendor} – ₹{Number(po.amount).toLocaleString()}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Invoices</h2>
        <ul>
          {invoices?.map((inv: any) => (
            <li key={inv.id}>{inv.vendor} – ₹{Number(inv.amount).toLocaleString()}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Savings Snapshots</h2>
        <ul>
          {savings?.map((snap: any) => (
            <li key={snap.id}>{snap.period} {snap.periodStart?.substring(0, 10)} – Saved ₹{Number(snap.saved).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
