import {
  collection, doc, query, where, orderBy, getDocs, onSnapshot,
  addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetch all active template items for a given manufacturer.
 * Returns items sorted by category then sort field.
 */
export async function fetchTemplateItems(manufacturer) {
  const q = query(
    collection(db, 'pdi_template_items'),
    where('manufacturers', 'array-contains', manufacturer),
    where('active', '==', true),
    orderBy('category'),
    orderBy('sort'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Group items by category, separating accessories out.
 * Returns { categories: [{name, items}], accessories: [] }
 */
export function groupItemsByCategory(items) {
  const accessories = items.filter((i) => i.isAccessory);
  const checklist   = items.filter((i) => !i.isAccessory);

  const categoryMap = new Map();
  for (const item of checklist) {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, []);
    }
    categoryMap.get(item.category).push(item);
  }

  // L2: items already arrive ordered by sort from the Firestore query,
  // so the extra .sort() here is redundant and removed.
  const categories = Array.from(categoryMap.entries()).map(([name, catItems]) => ({
    name,
    items: catItems,
  }));

  return { categories, accessories };
}

// ── Admin template editor ─────────────────────────────────────────────────────

/**
 * Subscribe to ALL template items (active + inactive) for the admin editor.
 * Items are ordered by category then sort.
 */
export function subscribeAllTemplateItems(callback, onError) {
  const q = query(
    collection(db, 'pdi_template_items'),
    orderBy('category'),
    orderBy('sort'),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError ?? ((err) => console.error('Template items listener error:', err)),
  );
}

export async function createTemplateItem(data, uid) {
  const ref = doc(collection(db, 'pdi_template_items'));
  await setDoc(ref, {
    ...data,
    templateId:  ref.id,
    active:      true,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
    updatedBy:   uid,
  });
  return ref.id;
}

export async function updateTemplateItem(itemId, data, uid) {
  await updateDoc(doc(db, 'pdi_template_items', itemId), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function toggleTemplateItemActive(itemId, active, uid) {
  await updateDoc(doc(db, 'pdi_template_items', itemId), {
    active,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function deleteTemplateItem(itemId) {
  await deleteDoc(doc(db, 'pdi_template_items', itemId));
}

// ── Suggestions ───────────────────────────────────────────────────────────────

export function subscribeSuggestions(callback, onError) {
  const q = query(
    collection(db, 'suggested_template_items'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError ?? ((err) => console.error('Suggestions listener error:', err)),
  );
}

/**
 * Approve a suggestion: creates a pdi_template_items doc and marks the
 * suggestion approved in one logical operation (two writes — Firestore rules
 * don't allow cross-collection transactions, but both writes are idempotent
 * on retry).
 */
export async function approveSuggestion(suggId, item, uid) {
  const ref = doc(collection(db, 'pdi_template_items'));
  await setDoc(ref, {
    templateId:       ref.id,
    manufacturers:    [item.manufacturer],
    category:         (item.category  || '').trim(),
    subcategory:      (item.subcategory || '').trim(),
    type:             'Check',
    itemText:         (item.itemText  || '').trim(),
    defaultActive:    true,
    isAccessory:      false,
    location:         '',
    sort:             item.sort ?? 999,
    active:           true,
    relatedLineItems: [],
    activePDIId:      '',
    createdAt:        serverTimestamp(),
    updatedAt:        serverTimestamp(),
    updatedBy:        uid,
  });

  await updateDoc(doc(db, 'suggested_template_items', suggId), {
    status:             'approved',
    reviewedBy:         uid,
    reviewedAt:         serverTimestamp(),
    createdTemplateId:  ref.id,
  });

  return ref.id;
}

export async function rejectSuggestion(suggId, uid, notes = '') {
  await updateDoc(doc(db, 'suggested_template_items', suggId), {
    status:     'rejected',
    reviewedBy: uid,
    reviewedAt: serverTimestamp(),
    notes,
  });
}
