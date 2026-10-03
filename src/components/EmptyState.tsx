import type { ReactNode } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';

interface Props {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

/** Mirakurun の NonIdealState 相当。空状態・読込中・エラーの共通表示。 */
export function EmptyState({ title, description, icon, loading }: Props) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 5, color: 'text.secondary' }}>
      {loading ? <CircularProgress size={28} /> : icon}
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {description}
        </Typography>
      )}
    </Stack>
  );
}

/** セクション見出し(区切り線付き)。 */
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
        {children}
      </Typography>
      <Box sx={{ height: 2, bgcolor: 'divider', mt: 0.5, borderRadius: 1 }} />
    </Box>
  );
}
