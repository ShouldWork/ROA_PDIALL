/**
 * seedTemplate.mjs
 *
 * Seeds pdi_template_items from PDI_LIST_ALL.csv into Firestore.
 *
 * Usage:
 *   node scripts/seedTemplate.mjs
 *
 * Requires:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a Firebase
 *     service account JSON, OR run via `firebase emulators:exec` for local dev.
 *   - FIREBASE_PROJECT_ID env var (or set in script below).
 *
 * Install runtime deps first:
 *   npm install --save-dev firebase-admin csv-parse
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH  = resolve(__dirname, '../../PDI_LIST_ALL.csv');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'roa-delivery';

// ── Init Admin SDK ──────────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID,
});
const db = admin.firestore();

// ── Normalise PresentIn → manufacturers array ───────────────────────────────
function normalizeManufacturers(raw) {
  if (!raw || !raw.trim()) return ['PAUSE', 'MDC']; // blank = both

  // Strip surrounding quotes if present
  const val = raw.trim().replace(/^"|"$/g, '');

  const normalized = val
    .toUpperCase()
    .split(/[,/\\|&+ ]+/)     // split on , / \ | & + or space
    .map((s) => s.trim())
    .filter((s) => s === 'MDC' || s === 'PAUSE');

  // De-duplicate while preserving order
  return [...new Set(normalized.length ? normalized : ['PAUSE', 'MDC'])];
}

// ── Parse CSV ───────────────────────────────────────────────────────────────
const raw = readFileSync(CSV_PATH, 'utf-8')
  // Remove BOM if present
  .replace(/^\uFEFF/, '');

const records = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
});

// ── Transform rows ──────────────────────────────────────────────────────────
function transformRow(row) {
  const presentIn = row['PresentIn'] || '';
  const manufacturers = normalizeManufacturers(presentIn);

  // Detect accessories — PresentIn values that don't cleanly parse to a
  // manufacturer list often indicate data bleed; the Category is authoritative.
  const isAccessory = (row['Category'] || '').trim() === 'OEM Accessory';

  const relatedRaw = row['Related PDI_LineItems'] || '';
  const relatedLineItems = relatedRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    templateId:       row['TemplateId']?.trim() || '',
    category:         row['Category']?.trim() || '',
    subcategory:      row['Subcategory']?.trim() || '',
    type:             row['Type']?.trim() || 'Check',
    itemText:         row['ItemText']?.trim() || '',
    defaultActive:    (row['DefaultActive'] || '').toUpperCase() === 'Y',
    isAccessory,
    manufacturers,
    location:         row['Location']?.trim() || '',
    sort:             parseInt(row['Sort'], 10) || 0,
    active:           true,    // all items active by default
    relatedLineItems,
    activePDIId:      row['ActivePDIId']?.trim() || '',
    createdAt:        admin.firestore.FieldValue.serverTimestamp(),
    updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
    updatedBy:        'seed-script',
  };
}

// ── Write to Firestore ──────────────────────────────────────────────────────
async function seed() {
  const items = records.map(transformRow).filter((i) => i.templateId);

  console.log(`Seeding ${items.length} template items into Firestore…`);

  const BATCH_SIZE = 400; // Firestore max per batch = 500
  let total = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = items.slice(i, i + BATCH_SIZE);

    for (const item of slice) {
      const ref = db.collection('pdi_template_items').doc(item.templateId);
      // M6: merge:true so re-running the seed updates fields without destroying
      // any manually-added fields (e.g. adminNotes). To fully replace a doc,
      // delete it in Firestore first.
      batch.set(ref, item, { merge: true });
    }

    await batch.commit();
    total += slice.length;
    console.log(`  ✓ ${total}/${items.length} committed`);
  }

  // Log any rows that had suspicious PresentIn values
  const suspicious = records.filter((r) => {
    const v = (r['PresentIn'] || '').trim();
    const m = normalizeManufacturers(v);
    return m.length === 0 && v.length > 0;
  });
  if (suspicious.length) {
    console.warn(`\n⚠  ${suspicious.length} rows had unrecognised PresentIn values (defaulted to both):`);
    suspicious.forEach((r) => console.warn(`  ${r['TemplateId']} → "${r['PresentIn']}"`));
  }

  console.log('\n✅  Seed complete.');
}

// M6: process.exit belongs in the caller, not inside the function
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
