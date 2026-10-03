import { useMemo, useState } from 'react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AppStateProvider } from './state/AppState';
import { ThemeModeContext } from './themeMode';
import { createAppTheme } from './theme';
import type { ThemeMode } from './api/types';

const THEME_KEY = 'mirakc-webui:theme';

function readStoredMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore storage access errors */
  }
  return 'dark';
}

function Root() {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);

  const toggle = () => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore storage access errors */
      }
      return next;
    });
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const modeValue = useMemo(() => ({ mode, toggle }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeModeContext.Provider value={modeValue}>
        <AppStateProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AppStateProvider>
      </ThemeModeContext.Provider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Root />
    </AppErrorBoundary>
  </React.StrictMode>
);
