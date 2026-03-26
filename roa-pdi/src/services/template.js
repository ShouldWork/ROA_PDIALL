import {
  collection, query, where, orderBy, getDocs,
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
