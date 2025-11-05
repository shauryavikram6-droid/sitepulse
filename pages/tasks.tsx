import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import { useDemoSite } from '@/lib/useDemoSite';

const fetcher = (url: string | null) => (url ? fetch(url).then((res) => res.json()) : []);

export default function TasksPage() {
  const { siteId } = useDemoSite();
  const { data: tasks, mutate } = useSWR(siteId ? `/api/v1/sites/${siteId}/tasks` : null, fetcher);
  const [form, setForm] = useState({ title: '', description: '' });

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteId) return;
    await fetch(`/api/v1/sites/${siteId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ title: '', description: '' });
    mutate();
  };

  const markDone = async (taskId: string) => {
    await fetch(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' })
    });
    mutate();
  };

  return (
    <main className="container">
      <h1>Tasks</h1>
      <div className="card">
        <h2>Create Task</h2>
        <form onSubmit={createTask}>
          <label htmlFor="title">Title</label>
          <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label htmlFor="description">Description</label>
          <textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <button className="btn-primary" type="submit">Create</button>
        </form>
      </div>
      <div className="card">
        <h2>Open Tasks</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.map((task: any) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.status}</td>
                <td>
                  <button className="btn-primary" type="button" onClick={() => markDone(task.id)}>Mark Done</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
