import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { buildTheme } from '../theme';

const ThemeContext = createContext({ mode: 'dark', toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('roa-theme') ?? 'dark',
  );

  function toggleMode() {
    setMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark';
      localStorage.setItem('roa-theme', next);
      return next;
    });
  }

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
