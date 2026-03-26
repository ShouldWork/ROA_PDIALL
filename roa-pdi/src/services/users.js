import {
  collection, doc, updateDoc, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// M1: onError callback is now accepted so callers can surface listener failures.
export function subscribeAllUsers(callback, onError) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError ?? ((err) => console.error('subscribeAllUsers error:', err)),
  );
}

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function updateUserActive(uid, active) {
  await updateDoc(doc(db, 'users', uid), { active });
}

export async function activateUser(uid, role) {
  await updateDoc(doc(db, 'users', uid), { active: true, role });
}
