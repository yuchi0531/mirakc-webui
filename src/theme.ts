import { createTheme } from '@mui/material/styles';
import type { ThemeMode } from './api/types';

/**
 * Mirakurun 4.1.5 のテーマに合わせた MUI v5 テーマ。
 * primary は Mirakurun 公式 UI の amber (#ffd56c dark / #ffc126 light)。
 * 2K/4K のサービス種別を色分けするための独自パレットも定義する。
 */
export function createAppTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  const theme = createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#ffd56c' : '#ffc126' },
      secondary: { main: '#ce93d8' },
      ...(isDark
        ? {}
        : {
            background: { default: '#f6f7f9', paper: '#ffffff' },
          }),
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Oxygen"',
        '"Ubuntu"',
        '"Cantarell"',
        '"Open Sans"',
        '"Helvetica Neue"',
        '"Yu Gothic"',
        '"Noto Sans JP"',
        'sans-serif',
      ].join(','),
      button: { textTransform: 'none' },
    },
    shape: { borderRadius: 4 },
  });

  return theme;
}

/**
 * ジャンル大分類 (EPG lv1) ごとの背景色。Mirakurun 公式 UI の
 * `bg-genre-lv1-N` に相当する。テーマに依存せず 2K/4K 双方で使えるよう
 * 同一値を持つ。
 */
export const GENRE_BG: Record<number, string> = {
  0: '#ffffe0',
  1: '#e0e0ff',
  2: '#ffe0f0',
  3: '#ffe0e0',
  4: '#e0ffe0',
  5: '#e0ffff',
  6: '#fff0e0',
  7: '#ffe0ff',
  8: '#e0f0ff',
  9: '#f0f0f0',
  10: '#fff0f0',
  11: '#f0f0ff',
  12: '#f0ffff',
  13: '#f0fff0',
  14: '#fff0f0',
  15: '#f0f0f0',
};

export function genreBackground(lv1: number | undefined): string | undefined {
  if (lv1 === undefined) return undefined;
  return GENRE_BG[lv1];
}
