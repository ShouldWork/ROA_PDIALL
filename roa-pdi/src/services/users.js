import {
  collection, doc, updateDoc, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export function subscribeAllUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(users);
  });
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
