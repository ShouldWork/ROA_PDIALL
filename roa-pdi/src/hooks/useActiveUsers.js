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
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { users, loading };
}

/** Returns only active technicians. */
export function useTechnicians() {
  const { users, loading } = useActiveUsers();
  return {
    technicians: users.filter((u) => u.role === 'technician'),
    loading,
  };
}
