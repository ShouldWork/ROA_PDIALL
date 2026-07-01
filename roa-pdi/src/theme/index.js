import { createTheme } from '@mui/material/styles';

// Amber accent — same in both themes
const AMBER       = '#F59E0B';
const AMBER_DARK  = '#D97706';

// Paused status — a cool slate, deliberately NOT amber. `in_progress` owns the
// primary amber; paused must never read as the same state at a glance (the app
// principle is "status is the first thing the eye finds"). `warning` stays amber
// for genuine warnings (fail rate, pending), so paused gets its own token.
const SLATE       = '#475569';
const SLATE_DARK  = '#94A3B8';

// Nav is always dark regardless of the user's light/dark preference.
// Export as constants so AppShell can reference the same values.
export const NAV_BG        = '#0B0C0F';
export const NAV_BORDER    = '#1E2028';
export const NAV_TEXT      = 'rgba(255,255,255,0.55)';
export const NAV_TEXT_ACTIVE = '#FFFFFF';
export const NAV_ACTIVE_BG = 'rgba(245,158,11,0.10)';
export const NAV_ACCENT    = AMBER;

function components(isDark) {
  const border = isDark ? '#272A33' : '#E4E4E7';
  return {
    MuiButton: {
      defaultProps:   { disableElevation: true },
      styleOverrides: {
        root:      { borderRadius: 2, textTransform: 'none', fontWeight: 600, letterSpacing: 0.2 },
        sizeLarge: { padding: '10px 24px', fontSize: '0.9375rem' },
        sizeSmall: { padding: '4px 12px' },
      },
    },
    MuiCard: {
      defaultProps:   { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow:    'none',
          border:       `1px solid ${border}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 2, fontWeight: 500 } },
    },
    MuiPaper: {
      defaultProps:   { elevation: 0 },
      styleOverrides: { root: { borderRadius: 0, backgroundImage: 'none' } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 0 } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRadius: 0 } },
    },
    MuiAccordion: {
      defaultProps:   { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius:    '0 !important',
          backgroundImage: 'none',
          boxShadow:       'none',
          border:          `1px solid ${border}`,
          '&:not(:last-child)': { borderBottom: 0 },
          '&:before':      { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root:    { minHeight: 48, '&.Mui-expanded': { minHeight: 48 } },
        content: { '&.Mui-expanded': { margin: '12px 0' } },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 0 } },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, minWidth: 0, letterSpacing: 0.2 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 0, height: 4 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? '#3A3D4A' : '#D1D5DB',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: { paper: { borderRadius: 2 } },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: 2, border: `1px solid ${border}` } },
    },
    MuiFab: {
      styleOverrides: { root: { borderRadius: 2, boxShadow: 'none' } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { borderRadius: 1 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: isDark ? '#111318' : '#F9FAFB', borderColor: border },
        root: { borderColor: border },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        track: { borderRadius: 2 },
        thumb: { borderRadius: 1 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { height: 64 } },
    },
  };
}

export function buildTheme(mode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary:   { main: AMBER, dark: AMBER_DARK, light: '#FCD34D', contrastText: '#000' },
      secondary: isDark
        ? { main: '#60A5FA', dark: '#3B82F6', light: '#93C5FD', contrastText: '#000' }
        : { main: '#2563EB', dark: '#1D4ED8', light: '#60A5FA', contrastText: '#fff' },
      success:  { main: isDark ? '#22C55E' : '#16A34A', contrastText: '#fff' },
      error:    { main: isDark ? '#F87171' : '#DC2626', contrastText: '#fff' },
      warning:  { main: AMBER, dark: AMBER_DARK, contrastText: '#000' },
      paused: isDark
        ? { main: SLATE_DARK, light: '#CBD5E1', dark: '#64748B', contrastText: '#0B0C0F' }
        : { main: SLATE,      light: '#64748B', dark: '#334155', contrastText: '#FFFFFF' },
      background: {
        default: isDark ? '#0D0E12' : '#F4F4F5',
        paper:   isDark ? '#16181E' : '#FFFFFF',
      },
      divider:  isDark ? '#272A33' : '#E4E4E7',
      text: {
        primary:   isDark ? '#EDEDED' : '#111827',
        secondary: isDark ? '#8B8FA8' : '#6B7280',
        disabled:  isDark ? '#4B5563' : '#9CA3AF',
      },
      action: {
        hover:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        selected: isDark ? 'rgba(245,158,11,0.12)'  : 'rgba(245,158,11,0.10)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5:       { fontWeight: 700, letterSpacing: -0.3 },
      h6:       { fontWeight: 700, letterSpacing: -0.2 },
      subtitle1:{ fontWeight: 600 },
      subtitle2:{ fontWeight: 600 },
      button:   { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 2 },
    components: components(isDark),
  });
}

// Default export (dark) used as fallback before context hydrates
export default buildTheme('dark');
