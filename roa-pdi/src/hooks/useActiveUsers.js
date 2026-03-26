import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/** Returns all active users (for assignment dropdowns). */
export function useActiveUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('active', '==', true),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        // M1: surface listener errors so callers can react
        console.error('useActiveUsers error:', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { users, loading };
}

/**
 * Returns only active technicians.
 * H4: uses its own targeted query instead of filtering all active users
 * client-side, avoiding fetching admin/SW records unnecessarily.
 */
export function useTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('active', '==', true),
      where('role', '==', 'technician'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('useTechnicians error:', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { technicians, loading };
}
