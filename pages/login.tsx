import { FormEvent, useState } from 'react';
import Router from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('sitepulse123');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      Router.replace('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <main>
      <div className="container" style={{ maxWidth: '400px' }}>
        <div className="card">
          <h1>SitePulse Login</h1>
          <form onSubmit={onSubmit}>
            <label htmlFor="email">Email</label>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error ? <p style={{ color: 'red' }}>{error}</p> : null}
            <button className="btn-primary" type="submit">Log In</button>
          </form>
          <p style={{ fontSize: '0.85rem', color: '#475569' }}>Demo users: admin@demo.com, pm@demo.com, engineer@demo.com (password: sitepulse123)</p>
        </div>
      </div>
    </main>
  );
}
