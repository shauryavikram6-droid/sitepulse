import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function DprPage() {
  const { siteId } = useDemoSite();
  const { data: prompts, mutate } = useSWR(siteId ? `/api/v1/sites/${siteId}/dpr/history` : null, fetcher);

  const sendPrompt = async () => {
    if (!siteId) return;
    await fetch(`/api/v1/sites/${siteId}/dpr/send`, { method: 'POST' });
    mutate();
  };

  return (
    <main className="container">
      <h1>Daily Progress Reports</h1>
      <button className="btn-primary" onClick={sendPrompt}>Send DPR Prompt</button>
      <div className="card" style={{ marginTop: '1rem' }}>
        <ul>
          {prompts?.map((prompt: any) => (
            <li key={prompt.id}>
              {prompt.date?.substring(0, 10)} – {prompt.status}
              <pre style={{ whiteSpace: 'pre-wrap' }}>{prompt.answers?.map((a: any) => `${a.question.promptText}: ${a.answerText}`).join('\n')}</pre>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
