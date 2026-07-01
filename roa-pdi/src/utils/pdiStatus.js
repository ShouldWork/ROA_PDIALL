export const STATUS_CONFIG = {
  not_started:        { label: 'Not Started',        chipColor: 'default' },
  in_progress:        { label: 'In Progress',        chipColor: 'primary' },
  paused:             { label: 'Paused',             chipColor: 'paused'  },
  completed:          { label: 'Completed',          chipColor: 'success' },
  unable_to_complete: { label: 'Unable to Complete', chipColor: 'error'   },
};

// Valid status transitions per current status
export const ALLOWED_TRANSITIONS = {
  not_started:        ['in_progress'],
  in_progress:        ['paused', 'completed', 'unable_to_complete'],
  paused:             ['in_progress', 'unable_to_complete'],
  completed:          [],
  unable_to_complete: [],
};

export const TRANSITION_LABELS = {
  in_progress:        'Start PDI',
  paused:             'Pause',
  completed:          'Mark Complete',
  unable_to_complete: 'Unable to Complete',
};

// bg values use MUI sx theme tokens so they adapt to both light and dark mode
export const RESULT_CONFIG = {
  pass:           { label: 'Pass',     bg: 'success.main',  text: '#fff' },
  fail:           { label: 'Fail',     bg: 'error.main',    text: '#fff' },
  not_applicable: { label: 'N/A',      bg: 'text.disabled', text: '#fff' },
  untested:       { label: 'Untested', bg: 'transparent',   text: 'text.secondary' },
};

export const ACCESSORY_RESULT_CONFIG = {
  present:        { label: 'Present',     bg: 'success.main',  text: '#fff' },
  not_present:    { label: 'Not Present', bg: 'error.main',    text: '#fff' },
  not_applicable: { label: 'N/A',         bg: 'text.disabled', text: '#fff' },
};

// Pass-rate text color, thresholded so a low rate never shows a reassuring
// green. Returns a legible hex per theme mode: the semantic .main tokens are
// unusable as text here (warning is amber, ~2:1 on a light surface), so these
// are text-safe shades that clear WCAG AA on both paper colors.
export function passRateColor(rate, isDark) {
  if (rate >= 90) return isDark ? '#4ADE80' : '#166534'; // healthy
  if (rate >= 75) return isDark ? '#FBBF24' : '#B45309'; // watch
  return isDark ? '#F87171' : '#B91C1C';                 // poor
}

// L1: single-pass reduce instead of three separate filter calls over the same array
export function getProgressStats(items) {
  let total = 0, totalAccessories = 0, evaluated = 0, passed = 0, failed = 0;

  for (const item of items) {
    if (item.isAccessory) { totalAccessories++; continue; }
    total++;
    if (!item.result || item.result === 'untested') continue;
    evaluated++;
    if (item.result === 'pass') passed++;
    if (item.result === 'fail') failed++;
  }

  return {
    total,
    totalAccessories,
    evaluated,
    passed,
    failed,
    passRate:    evaluated ? Math.round((passed    / evaluated) * 100) : 0,
    progressPct: total     ? Math.round((evaluated / total)    * 100) : 0,
  };
}
