import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',       // deep blue — professional
      light: '#1E88E5',
      dark: '#0D47A1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF6F00',       // amber — accent for actions
      light: '#FFA000',
      dark: '#E65100',
      contrastText: '#fff',
    },
    success: { main: '#2E7D32' },
    error:   { main: '#C62828' },
    warning: { main: '#F57F17' },
    grey: {
      50:  '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
    },
    background: {
      default: '#F5F6F8',
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#212121',
      secondary: '#616161',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
        sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #E0E0E0',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minWidth: 0 } },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 600, backgroundColor: '#F5F6F8' } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 4, height: 8 } },
    },
  },
});

export default theme;
