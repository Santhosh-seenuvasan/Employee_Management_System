import { useState, useEffect, useCallback } from 'react';
import { fetchJson } from './useAuth';

/**
 * Generic data-fetching hook.
 * Usage: const { data, loading, error, refetch } = useApi('/api/some-endpoint');
 */
export function useApi(url, defaultValue = null) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson(url);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export default useApi;
