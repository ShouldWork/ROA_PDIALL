import { getProgressStats } from '../utils/pdiStatus';
import { groupItemsByCategory } from '../services/template';
import { formatTimestamp } from '../utils/time';

// Customer-facing manufacturer labels. The raw codes (PAUSE/MDC) are internal.
const MFR_LABELS = {
  PAUSE: 'Pause Trailers',
  MDC:   'MDC Trailers',
};

/**
 * Human-friendly duration for reports — "2 hr 35 min" reads better on a
 * document than the dashboard's running clock format.
 */
export function humanizeDuration(totalSeconds) {
  const s = Math.max(0, totalSeconds ?? 0);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h && m) return `${h} hr ${m} min`;
  if (h)      return `${h} hr`;
  return `${m} min`;
}

/**
 * Shape a PDI document + its items subcollection into everything both report
 * variants need. Reuses the same progress + grouping logic the live app uses so
 * a report can never disagree with the dashboard.
 */
export function buildReportModel(pdi, items) {
  const stats = getProgressStats(items);
  const { categories, accessories } = groupItemsByCategory(items);
  const failed = items.filter((i) => !i.isAccessory && i.result === 'fail');

  return {
    roNumber:          pdi.repairOrderNumber,
    manufacturer:      pdi.manufacturer,
    manufacturerLabel: MFR_LABELS[pdi.manufacturer] ?? pdi.manufacturer,
    technicianName:    pdi.technicianName || '—',
    status:            pdi.status,
    createdAt:         formatTimestamp(pdi.createdAt),
    completedAt:       formatTimestamp(pdi.completedAt),
    totalTime:         humanizeDuration(pdi.timeElapsedSeconds),
    stats,
    categories,
    accessories,
    failed,
  };
}
