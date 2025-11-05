import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDemoSite() {
  const { data, error } = useSWR('/api/v1/me/sites', fetcher);
  const site = data?.[0];
  const siteId = site?.id as string | undefined;
  return { site, siteId, isLoading: !error && !data, error };
}
