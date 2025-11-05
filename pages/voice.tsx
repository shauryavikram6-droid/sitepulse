import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function VoicePage() {
  const { siteId } = useDemoSite();
  const { data: notes, mutate } = useSWR(siteId ? `/api/v1/sites/${siteId}/voice` : null, fetcher);
  const [form, setForm] = useState({ filePath: '/uploads/audio/new-note.mp3', mediaType: 'audio/mpeg' });

  const uploadNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteId) return;
    const response = await fetch(`/api/v1/sites/${siteId}/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, storageProvider: 'local' })
    });
    const note = await response.json();
    await fetch(`/api/v1/voice/${note.id}/transcribe`, { method: 'POST' });
    await fetch(`/api/v1/voice/${note.id}/to-tasks`, { method: 'POST' });
    mutate();
  };

  return (
    <main className="container">
      <h1>Voice → Checklist</h1>
      <div className="card">
        <h2>Upload Voice Note</h2>
        <form onSubmit={uploadNote}>
          <label htmlFor="file">File Path</label>
          <input id="file" value={form.filePath} onChange={(e) => setForm({ ...form, filePath: e.target.value })} />
          <button className="btn-primary" type="submit">Simulate Upload</button>
        </form>
      </div>
      <div className="card">
        <h2>Recent Notes</h2>
        <ul>
          {notes?.map((note: any) => (
            <li key={note.id}>{note.transcribedText ?? 'Pending transcription'}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
