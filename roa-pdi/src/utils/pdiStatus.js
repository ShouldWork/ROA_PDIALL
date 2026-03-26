export const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    chipColor: 'default',
    color: '#757575',
  },
  in_progress: {
    label: 'In Progress',
    chipColor: 'primary',
    color: '#1565C0',
  },
  paused: {
    label: 'Paused',
    chipColor: 'warning',
    color: '#F57F17',
  },
  completed: {
    label: 'Completed',
    chipColor: 'success',
    color: '#2E7D32',
  },
  unable_to_complete: {
    label: 'Unable to Complete',
    chipColor: 'error',
    color: '#C62828',
  },
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

export const RESULT_CONFIG = {
  pass: {
    label: 'Pass',
    bg: '#2E7D32',
    text: '#fff',
    variant: 'contained',
  },
  fail: {
    label: 'Fail',
    bg: '#C62828',
    text: '#fff',
    variant: 'contained',
  },
  not_applicable: {
    label: 'N/A',
    bg: '#757575',
    text: '#fff',
    variant: 'contained',
  },
  untested: {
    label: 'Untested',
    bg: 'transparent',
    text: '#616161',
    variant: 'outlined',
  },
};

export const ACCESSORY_RESULT_CONFIG = {
  present:        { label: 'Present',     bg: '#2E7D32', text: '#fff' },
  not_present:    { label: 'Not Present', bg: '#C62828', text: '#fff' },
  not_applicable: { label: 'N/A',         bg: '#757575', text: '#fff' },
};

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
