import { useEffect } from 'react';
import Router from 'next/router';

export default function IndexPage() {
  useEffect(() => {
    Router.replace('/login');
  }, []);
  return null;
}
