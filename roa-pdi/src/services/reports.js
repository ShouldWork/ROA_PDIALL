import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { registerReportFonts } from '../reports/fonts';
import InternalReport from '../reports/InternalReport';
import CustomerReport from '../reports/CustomerReport';
import { setReportUrls } from './pdi';

// Storage path layout: pdi_reports/{pdiId}/{kind}-{roNumber}.pdf
// NOTE: Storage security rules must permit authenticated writes under
// pdi_reports/. Those rules are not yet in this repo — see the reports
// follow-up before relying on this in production.
function reportPath(pdiId, kind, roNumber) {
  const safeRO = String(roNumber || pdiId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `pdi_reports/${pdiId}/${kind}-${safeRO}.pdf`;
}

async function renderAndUpload(component, props, pdiId, kind, roNumber) {
  const blob = await pdf(createElement(component, props)).toBlob();
  const storageRef = ref(storage, reportPath(pdiId, kind, roNumber));
  await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
  return getDownloadURL(storageRef);
}

/**
 * Generate both PDI report variants, upload them to Storage, and write the
 * download URLs back onto the PDI document.
 *
 * Returns { reportUrl, internalReportUrl }. Throws if any step fails — callers
 * should surface the error to the user and leave the PDI untouched (the URLs
 * are only written once both PDFs upload successfully).
 */
export async function generatePDIReports(pdi, items, uid) {
  registerReportFonts();

  const [internalReportUrl, reportUrl] = await Promise.all([
    renderAndUpload(InternalReport, { pdi, items }, pdi.id, 'internal', pdi.repairOrderNumber),
    renderAndUpload(CustomerReport, { pdi, items }, pdi.id, 'customer', pdi.repairOrderNumber),
  ]);

  await setReportUrls(pdi.id, { reportUrl, internalReportUrl }, uid);
  return { reportUrl, internalReportUrl };
}
