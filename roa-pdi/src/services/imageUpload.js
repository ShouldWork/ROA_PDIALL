import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_IMAGES  = 5;
const MAX_SIZE_MB = 10;

export { MAX_IMAGES };

/**
 * Upload a single image file for a PDI item.
 * Returns a promise that resolves to the download URL.
 * onProgress(0–100) is called during upload.
 */
export function uploadPDIImage(pdiId, itemId, file, onProgress) {
  return new Promise((resolve, reject) => {
    // M3: validate MIME type client-side before attempting upload
    if (!file.type.startsWith('image/')) {
      reject(new Error('Only image files are allowed.'));
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      reject(new Error(`Image must be under ${MAX_SIZE_MB} MB.`));
      return;
    }

    // H2: guard against filenames with no extension (e.g. "photo" → "photo.jpg")
    const dotIndex = file.name.lastIndexOf('.');
    const ext      = dotIndex > 0 ? file.name.slice(dotIndex + 1) : 'jpg';
    const filename = `${Date.now()}.${ext}`;
    const path     = `pdi_images/${pdiId}/${itemId}/${filename}`;
    const storageRef = ref(storage, path);

    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

/**
 * Delete an image from Firebase Storage by its download URL.
 * Extracts the path from the URL — safe only for our own storage bucket.
 */
export async function deletePDIImage(url) {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // Non-critical — Firestore reference already removed by caller
  }
}
