import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function AttendancePage() {
  const { site, siteId } = useDemoSite();
  const { data: trades } = useSWR(site ? `/api/v1/orgs/${site.orgId}/trades` : null, fetcher);
  const { data: attendance, mutate } = useSWR(siteId ? `/api/v1/sites/${siteId}/attendance` : null, fetcher);
  const [form, setForm] = useState({ date: '', tradeId: '', headcount: 0 });
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteId) return;
    await fetch(`/api/v1/sites/${siteId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': Date.now().toString() },
      body: JSON.stringify({ entries: [{ ...form, headcount: Number(form.headcount) }] })
    });
    setForm({ date: '', tradeId: '', headcount: 0 });
    mutate();
  };

  return (
    <main className="container">
      <h1>Attendance Capture</h1>
      <div className="card">
        <h2>New Entry</h2>
        <form onSubmit={onSubmit}>
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <label htmlFor="trade">Trade</label>
          <select id="trade" value={form.tradeId} onChange={(e) => setForm({ ...form, tradeId: e.target.value })} required>
            <option value="">Select Trade</option>
            {trades?.map((trade: any) => (
              <option key={trade.id} value={trade.id}>{trade.name}</option>
            ))}
          </select>
          <label htmlFor="headcount">Headcount</label>
          <input id="headcount" type="number" value={form.headcount} onChange={(e) => setForm({ ...form, headcount: Number(e.target.value) })} required />
          <button className="btn-primary" type="submit">Save Attendance</button>
        </form>
      </div>
      <div className="card">
        <h2>Recent Entries</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Trade</th>
              <th>Headcount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {attendance?.map((row: any) => (
              <tr key={row.id}>
                <td>{row.date?.substring(0, 10)}</td>
                <td>{row.trade?.name}</td>
                <td>{row.headcount}</td>
                <td>₹{Number(row.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
