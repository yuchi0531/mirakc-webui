import { createTheme } from '@mui/material/styles';

// Material Design 2 look on MUI v5, dark mode, Mirakurun-style gold primary.
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ffd56c' },
    secondary: { main: '#90caf9' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Noto Sans JP"',
      '"Hiragino Kaku Gothic ProN"',
      'Meiryo',
      'sans-serif',
    ].join(','),
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 4 },
});
