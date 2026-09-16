import { createTheme } from '@mui/material/styles';

// miraview と同じ MUI v5 dark パレット。
// primary / secondary のみ明示し、残り(背景・文字色など)は MUI v5 dark のデフォルト値に従う。
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#ce93d8' },
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
