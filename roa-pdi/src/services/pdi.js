import {
  collection, doc, updateDoc, getDocs, runTransaction,
  query, where, writeBatch, serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Validation ────────────────────────────────────────────────────────────────

export async function isRONumberUnique(roNumber) {
  const q = query(
    collection(db, 'pdis'),
    where('repairOrderNumber', '==', roNumber.trim()),
  );
  const snap = await getDocs(q);
  return snap.empty;
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a new PDI and batch-write all template items as subcollection docs.
 * - technicianName is denormalized for display without extra lookups.
 * - progressSummary is denormalized on the PDI doc so the dashboard can
 *   show progress without loading any subcollection data.
 * - assignedTo is denormalized onto each item for Firestore rules.
 *
 * C3: Atomic creation — the PDI doc and all items are written in the same
 * batch(es). The PDI ref is pre-allocated with doc() so it can be included
 * in the first batch rather than created first with a separate addDoc() call.
 * If any batch fails the PDI document is never committed.
 */
export async function createPDI(
  { repairOrderNumber, manufacturer, assignedTo, technicianName, createdBy },
  templateItems,
) {
  const checklistTotal = templateItems.filter((i) => !i.isAccessory).length;

  // Pre-allocate the PDI ref — no Firestore call, just generates a local ID.
  const pdiRef = doc(collection(db, 'pdis'));

  const pdiData = {
    repairOrderNumber: repairOrderNumber.trim(),
    manufacturer,
    status:            'not_started',
    assignedTo,
    technicianName,                   // denormalized for dashboard display
    createdBy,
    createdAt:         serverTimestamp(),
    startedAt:         null,
    lastResumedAt:     null,
    completedAt:       null,
    timeElapsedSeconds: 0,
    // M5: statusHistory uses client ISO timestamp because serverTimestamp()
    // sentinels cannot be nested inside arrayUnion objects — known Firestore
    // limitation. Do not compare these against server-timestamp fields.
    statusHistory: [{
      status:    'not_started',
      changedAt: new Date().toISOString(),
      changedBy: createdBy,
    }],
    progressSummary: {                // denormalized for dashboard cards
      total:          checklistTotal,
      pass:           0,
      fail:           0,
      not_applicable: 0,
      untested:       0,
    },
    reportUrl:         null,
    internalReportUrl: null,
  };

  // First batch includes the PDI doc itself + the first chunk of items.
  // Subsequent batches (if > 489 items) contain only items.
  const BATCH_SIZE = 489; // 489 items + 1 PDI doc = 490, safely under the 500 limit
  let firstBatch = true;

  for (let i = 0; i < templateItems.length || firstBatch; i += BATCH_SIZE) {
    const batch = writeBatch(db);

    if (firstBatch) {
      batch.set(pdiRef, pdiData);
      firstBatch = false;
    }

    for (const item of templateItems.slice(i, i + BATCH_SIZE)) {
      const itemRef = doc(collection(db, 'pdis', pdiRef.id, 'items'));
      batch.set(itemRef, {
        templateId:  item.templateId ?? item.id,
        category:    item.category,
        subcategory: item.subcategory,
        itemText:    item.itemText,
        isAccessory: item.isAccessory,
        sort:        item.sort ?? 0,
        result:      null,
        images:      [],
        assignedTo,                   // denormalized for Firestore security rules
        updatedAt:   null,
        updatedBy:   null,
      });
    }

    await batch.commit();
  }

  return pdiRef.id;
}

// ── Status transitions ────────────────────────────────────────────────────────

// Private helper — the 5 public transitions all share this shape, only
// differing in the target status and which timer fields they touch.
function setPDIStatus(pdiId, status, uid, extraFields = {}) {
  return updateDoc(doc(db, 'pdis', pdiId), {
    status,
    statusHistory: arrayUnion({
      status, changedAt: new Date().toISOString(), changedBy: uid,
    }),
    ...extraFields,
  });
}

export function startPDI(pdiId, uid) {
  const now = serverTimestamp();
  return setPDIStatus(pdiId, 'in_progress', uid, { startedAt: now, lastResumedAt: now });
}

export function pausePDI(pdiId, uid, currentElapsedSeconds) {
  return setPDIStatus(pdiId, 'paused', uid, { timeElapsedSeconds: currentElapsedSeconds });
}

export function resumePDI(pdiId, uid) {
  return setPDIStatus(pdiId, 'in_progress', uid, { lastResumedAt: serverTimestamp() });
}

export function completePDI(pdiId, uid, currentElapsedSeconds) {
  return setPDIStatus(pdiId, 'completed', uid, {
    completedAt:        serverTimestamp(),
    timeElapsedSeconds: currentElapsedSeconds,
  });
}

export function markUnableToComplete(pdiId, uid, currentElapsedSeconds) {
  return setPDIStatus(pdiId, 'unable_to_complete', uid, { timeElapsedSeconds: currentElapsedSeconds });
}

// ── Item updates ──────────────────────────────────────────────────────────────

/**
 * Update a checklist item's result using a transaction so the PDI's
 * progressSummary stays in sync without loading all items on the dashboard.
 */
export async function updateItemResult(pdiId, itemId, newResult, uid) {
  const itemRef = doc(db, 'pdis', pdiId, 'items', itemId);
  const pdiRef  = doc(db, 'pdis', pdiId);

  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef);

    // C4: abort if the item was deleted between read and write
    if (!itemSnap.exists()) throw new Error('Item not found');

    const oldResult   = itemSnap.data().result      ?? null;
    const isAccessory = itemSnap.data().isAccessory ?? false;

    tx.update(itemRef, {
      result:    newResult,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });

    // Only checklist items (not accessories) feed into progressSummary
    if (!isAccessory) {
      const summaryUpdate = {};
      if (oldResult) {
        summaryUpdate[`progressSummary.${oldResult}`] = increment(-1);
      }
      if (newResult) {
        summaryUpdate[`progressSummary.${newResult}`] = increment(1);
      }
      if (Object.keys(summaryUpdate).length) {
        tx.update(pdiRef, summaryUpdate);
      }
    }
  });
}

export async function addImageToItem(pdiId, itemId, imageUrl, uid) {
  await updateDoc(doc(db, 'pdis', pdiId, 'items', itemId), {
    images:    arrayUnion(imageUrl),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function removeImageFromItem(pdiId, itemId, imageUrl, uid) {
  await updateDoc(doc(db, 'pdis', pdiId, 'items', itemId), {
    images:    arrayRemove(imageUrl),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

// ── Item stats (called on PDI completion) ─────────────────────────────────────

export async function updateItemStats(items, manufacturer) {
  const evaluated = items.filter((i) => !i.isAccessory && i.result && i.result !== 'untested');
  const failed    = items.filter((i) => !i.isAccessory && i.result === 'fail');
  const allTemplateIds = [...new Set(evaluated.map((i) => i.templateId))];

  const BATCH_SIZE = 490;
  for (let i = 0; i < allTemplateIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const templateId of allTemplateIds.slice(i, i + BATCH_SIZE)) {
      const statRef  = doc(db, 'item_stats', `${templateId}_${manufacturer}`);
      const isFailed = failed.some((f) => f.templateId === templateId);
      batch.set(statRef, {
        templateId,
        manufacturer,
        totalEvaluated: increment(1),
        totalFailed:    increment(isFailed ? 1 : 0),
        lastUpdated:    serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }
}
