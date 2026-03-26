import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Real-time list of PDIs.
 * Admin / Service Writer → all PDIs.
 * Technician → only their assigned PDIs.
 */
export function usePDIList() {
  const { user, userProfile } = useAuth();
  const [pdis, setPdis]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!user || !userProfile?.role) return;

    const isTech = userProfile.role === 'technician';

    const constraints = [orderBy('createdAt', 'desc')];
    if (isTech) {
      constraints.unshift(where('assignedTo', '==', user.uid));
    }

    const q = query(collection(db, 'pdis'), ...constraints);

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPdis(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, [user, userProfile?.role]);

  return { pdis, loading, error };
}
