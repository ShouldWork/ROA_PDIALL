import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, writeBatch, serverTimestamp, arrayUnion, increment,
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
 * assignedTo is denormalized onto each item for Firestore rules.
 */
export async function createPDI(
  { repairOrderNumber, manufacturer, assignedTo, createdBy },
  templateItems,
) {
  const pdiRef = await addDoc(collection(db, 'pdis'), {
    repairOrderNumber: repairOrderNumber.trim(),
    manufacturer,
    status: 'not_started',
    assignedTo,
    createdBy,
    createdAt: serverTimestamp(),
    startedAt: null,
    lastResumedAt: null,
    completedAt: null,
    timeElapsedSeconds: 0,
    statusHistory: [{
      status: 'not_started',
      changedAt: new Date().toISOString(),
      changedBy: createdBy,
    }],
    reportUrl: null,
    internalReportUrl: null,
  });

  // Batch-write items (max 490 per batch to stay under 500 limit)
  const BATCH_SIZE = 490;
  for (let i = 0; i < templateItems.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const item of templateItems.slice(i, i + BATCH_SIZE)) {
      const itemRef = doc(collection(db, 'pdis', pdiRef.id, 'items'));
      batch.set(itemRef, {
        templateId:      item.templateId ?? item.id,
        category:        item.category,
        subcategory:     item.subcategory,
        itemText:        item.itemText,
        isAccessory:     item.isAccessory,
        sort:            item.sort ?? 0,
        result:          null,
        images:          [],
        assignedTo,               // denormalized for Firestore security rules
        updatedAt:       null,
        updatedBy:       null,
      });
    }
    await batch.commit();
  }

  return pdiRef.id;
}

// ── Status transitions ────────────────────────────────────────────────────────

export async function startPDI(pdiId, uid) {
  const now = serverTimestamp();
  await updateDoc(doc(db, 'pdis', pdiId), {
    status: 'in_progress',
    startedAt: now,
    lastResumedAt: now,
    statusHistory: arrayUnion({
      status: 'in_progress',
      changedAt: new Date().toISOString(),
      changedBy: uid,
    }),
  });
}

export async function pausePDI(pdiId, uid, currentElapsedSeconds) {
  await updateDoc(doc(db, 'pdis', pdiId), {
    status: 'paused',
    timeElapsedSeconds: currentElapsedSeconds,
    statusHistory: arrayUnion({
      status: 'paused',
      changedAt: new Date().toISOString(),
      changedBy: uid,
    }),
  });
}

export async function resumePDI(pdiId, uid) {
  await updateDoc(doc(db, 'pdis', pdiId), {
    status: 'in_progress',
    lastResumedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status: 'in_progress',
      changedAt: new Date().toISOString(),
      changedBy: uid,
    }),
  });
}

export async function completePDI(pdiId, uid, currentElapsedSeconds) {
  await updateDoc(doc(db, 'pdis', pdiId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    timeElapsedSeconds: currentElapsedSeconds,
    statusHistory: arrayUnion({
      status: 'completed',
      changedAt: new Date().toISOString(),
      changedBy: uid,
    }),
  });
}

export async function markUnableToComplete(pdiId, uid, currentElapsedSeconds) {
  await updateDoc(doc(db, 'pdis', pdiId), {
    status: 'unable_to_complete',
    timeElapsedSeconds: currentElapsedSeconds,
    statusHistory: arrayUnion({
      status: 'unable_to_complete',
      changedAt: new Date().toISOString(),
      changedBy: uid,
    }),
  });
}

// ── Item updates ──────────────────────────────────────────────────────────────

export async function updateItemResult(pdiId, itemId, result, uid) {
  await updateDoc(doc(db, 'pdis', pdiId, 'items', itemId), {
    result,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function addImageToItem(pdiId, itemId, imageUrl, uid) {
  await updateDoc(doc(db, 'pdis', pdiId, 'items', itemId), {
    images: arrayUnion(imageUrl),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function removeImageFromItem(pdiId, itemId, imageUrl, uid) {
  // Firestore arrayRemove for URLs
  const { arrayRemove } = await import('firebase/firestore');
  await updateDoc(doc(db, 'pdis', pdiId, 'items', itemId), {
    images: arrayRemove(imageUrl),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

// ── Item stats (called on PDI completion) ────────────────────────────────────

export async function updateItemStats(items, manufacturer) {
  const BATCH_SIZE = 490;
  const failed = items.filter((i) => !i.isAccessory && i.result === 'fail');
  const evaluated = items.filter((i) => !i.isAccessory && i.result && i.result !== 'untested');

  const allTemplateIds = [...new Set(evaluated.map((i) => i.templateId))];

  for (let i = 0; i < allTemplateIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const templateId of allTemplateIds.slice(i, i + BATCH_SIZE)) {
      const statId = `${templateId}_${manufacturer}`;
      const statRef = doc(db, 'item_stats', statId);
      const isFailed = failed.some((f) => f.templateId === templateId);
      batch.set(
        statRef,
        {
          templateId,
          manufacturer,
          totalEvaluated: increment(1),
          totalFailed: increment(isFailed ? 1 : 0),
          lastUpdated: serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  }
}
