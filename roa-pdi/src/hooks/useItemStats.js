import { useCallback, useEffect, useState } from 'react';
import { fetchItemAnalytics } from '../services/analytics';

/**
 * One-time fetch of item-failure analytics rows. Unlike usePDIList this is not
 * a live listener — item_stats only changes on PDI completion, so a fetch on
 * mount (with a manual refresh) is enough and avoids holding a subscription on
 * a collection that grows with every template item × manufacturer.
 *
 * Returns { rows, loading, error, refresh }.
 */
export function useItemStats() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [nonce, setNonce]     = useState(0);

  useEffect(() => {
    let active = true;

    fetchItemAnalytics()
      .then((data) => {
        if (active) {
          setRows(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [nonce]);

  // Reset loading/error here (in an event handler, not the effect) and bump
  // the nonce to re-run the fetch.
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  return { rows, loading, error, refresh };
}
