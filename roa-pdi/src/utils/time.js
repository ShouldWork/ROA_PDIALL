export function formatElapsed(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Compute total elapsed seconds for a PDI.
 * timeElapsedSeconds = accumulated from past sessions.
 * If currently in_progress, adds time since lastResumedAt.
 */
export function computeElapsed(pdi) {
  const base = pdi?.timeElapsedSeconds ?? 0;
  if (pdi?.status === 'in_progress' && pdi?.lastResumedAt) {
    const resumedMs = pdi.lastResumedAt.toDate?.()?.getTime() ?? 0;
    const sessionSec = Math.floor((Date.now() - resumedMs) / 1000);
    return base + sessionSec;
  }
  return base;
}

export function formatTimestamp(ts) {
  if (!ts) return '—';
  const date = ts.toDate?.() ?? new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatDate(ts) {
  if (!ts) return '—';
  const date = ts.toDate?.() ?? new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
