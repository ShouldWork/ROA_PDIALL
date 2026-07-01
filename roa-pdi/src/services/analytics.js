import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Item-failure analytics, built from the item_stats pipeline that
 * updateItemStats() populates on every PDI completion.
 *
 * item_stats docs are keyed `{templateId}_{manufacturer}` and hold running
 * counts: { templateId, manufacturer, totalEvaluated, totalFailed }. They
 * carry no human-readable text, so we join against pdi_template_items to
 * recover the item text and category.
 *
 * Reads require admin per Firestore rules (item_stats) — this is only ever
 * called from the admin-guarded Analytics page.
 *
 * Returns rows shaped for the dashboard:
 *   { id, templateId, manufacturer, itemText, category,
 *     totalEvaluated, totalFailed, failRate }   // failRate is 0–100
 */
export async function fetchItemAnalytics() {
  const [statsSnap, templateSnap] = await Promise.all([
    getDocs(collection(db, 'item_stats')),
    getDocs(collection(db, 'pdi_template_items')),
  ]);

  // templateId (doc id) → { itemText, category }
  const templateMap = new Map();
  for (const d of templateSnap.docs) {
    const t = d.data();
    templateMap.set(d.id, {
      itemText: t.itemText || '(untitled item)',
      category: t.category || 'Uncategorized',
    });
  }

  return statsSnap.docs.map((d) => {
    const s         = d.data();
    const evaluated = s.totalEvaluated || 0;
    const failed    = s.totalFailed || 0;
    const template  = templateMap.get(s.templateId);
    return {
      id:             d.id,
      templateId:     s.templateId,
      manufacturer:   s.manufacturer,
      // A stat can outlive its template item (deleted from the editor); fall
      // back to the id so the row is still identifiable rather than blank.
      itemText:       template?.itemText || `Removed item (${s.templateId})`,
      category:       template?.category || 'Uncategorized',
      totalEvaluated: evaluated,
      totalFailed:    failed,
      failRate:       evaluated > 0 ? Math.round((failed / evaluated) * 100) : 0,
    };
  });
}
