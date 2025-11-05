import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function SafetyPage() {
  const { site, siteId } = useDemoSite();
  const { data: templates } = useSWR(site ? `/api/v1/orgs/${site.orgId}/safety/templates` : null, fetcher);
  const { data: checklists, mutate } = useSWR(siteId ? `/api/v1/sites/${siteId}/safety` : null, fetcher);
  const [templateId, setTemplateId] = useState('');
  const createChecklist = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteId) return;
    await fetch(`/api/v1/sites/${siteId}/safety/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, date: new Date().toISOString() })
    });
    mutate();
  };

  const complete = async (id: string) => {
    await fetch(`/api/v1/safety/checklists/${id}/complete`, { method: 'POST' });
    mutate();
  };

  return (
    <main className="container">
      <h1>Safety Checklists</h1>
      <div className="card">
        <h2>Create from Template</h2>
        <form onSubmit={createChecklist}>
          <label htmlFor="template">Template</label>
          <select id="template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
            <option value="">Select Template</option>
            {templates?.map((tpl: any) => (
              <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
            ))}
          </select>
          <button className="btn-primary" type="submit">Create Checklist</button>
        </form>
      </div>
      <div className="card">
        <h2>Recent Safety Walks</h2>
        <ul>
          {checklists?.map((cl: any) => (
            <li key={cl.id}>
              {cl.date?.substring(0, 10)} – {cl.status}
              {cl.status !== 'COMPLETED' ? (
                <button className="btn-primary" style={{ marginLeft: '1rem' }} onClick={() => complete(cl.id)}>Mark Complete</button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
