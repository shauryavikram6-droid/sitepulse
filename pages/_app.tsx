import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import Router from 'next/router';

function Navbar() {
  return (
    <nav className="navbar">
      <a href="/dashboard">Dashboard</a>
      <a href="/attendance">Attendance</a>
      <a href="/voice">Voice → Tasks</a>
      <a href="/tasks">Tasks</a>
      <a href="/safety">Safety</a>
      <a href="/financials">Bills & Savings</a>
      <a href="/progress">Progress</a>
      <a href="/dpr">DPR</a>
      <a href="/drawings">Drawings</a>
    </nav>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    if (window.location.pathname !== '/login') {
      checkAuth();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === false && window.location.pathname !== '/login') {
      Router.replace('/login');
    }
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated ? <Navbar /> : null}
      <Component {...pageProps} />
    </>
  );
}
