import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!pdiId) return;

    let pdiLoaded   = false;
    let itemsLoaded = false;

    const checkDone = () => {
      if (pdiLoaded && itemsLoaded) setLoading(false);
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
        pdiLoaded = true;
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
        itemsLoaded = true;
        checkDone();
      },
      (err) => { setError(err); setLoading(false); },
    );

    return () => {
      unsubPDI();
      unsubItems();
    };
  }, [pdiId]);

  const { categories, accessories } = groupItemsByCategory(items);

  return { pdi, items, categories, accessories, loading, error };
}
