import { useEffect, useState, useMemo, useRef } from 'react';
import { doc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { groupItemsByCategory } from '../services/template';

/**
 * Real-time listener for a single PDI document and its items subcollection.
 * Returns the PDI, grouped checklist items, and raw items array.
 */
export function usePDI(pdiId) {
  const [pdi, setPdi]         = useState(null);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // L6: single counter ref instead of two boolean closure variables.
  const loadedCount = useRef(0);

  useEffect(() => {
    if (!pdiId) return;

    // M2: Reset state when pdiId changes so stale data never bleeds through.
    setPdi(null);
    setItems([]);
    setError(null);
    setLoading(true);
    loadedCount.current = 0;

    const checkDone = () => {
      loadedCount.current += 1;
      if (loadedCount.current >= 2) setLoading(false);
    };

    // PDI document listener
    const unsubPDI = onSnapshot(
      doc(db, 'pdis', pdiId),
      (snap) => {
        if (!snap.exists()) {
          setError(new Error('PDI not found'));
          setLoading(false);
          return;
        }
        setPdi({ id: snap.id, ...snap.data() });
        checkDone();
      },
      (err) => { setError(err); setLoading(false); },
    );

    // Items subcollection listener
    const itemsQ = query(
      collection(db, 'pdis', pdiId, 'items'),
      orderBy('category'),
      orderBy('sort'),
    );

    const unsubItems = onSnapshot(
      itemsQ,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        checkDone();
      },
      (err) => { setError(err); setLoading(false); },
    );

    return () => {
      unsubPDI();
      unsubItems();
    };
  }, [pdiId]);

  // H1: memoize so groupItemsByCategory only runs when items actually change,
  // not on every render triggered by unrelated state (e.g. tab changes).
  const { categories, accessories } = useMemo(
    () => groupItemsByCategory(items),
    [items],
  );

  return { pdi, items, categories, accessories, loading, error };
}
