import { Alert, AppBar, Chip, Stack, Toolbar, Typography } from '@mui/material';
import type { SseStatus } from '../api/types';

interface Props {
  sseStatus: SseStatus;
  /** Number of tuners currently in use. */
  activeTuners: number;
  version: string | null;
  versionError: string | null;
}

function connectionChip(status: SseStatus, activeTuners: number) {
  switch (status) {
    case 'connecting':
      return <Chip label="接続中" color="info" size="small" />;
    case 'error':
      return <Chip label="切断" color="error" size="small" />;
    case 'open':
      return activeTuners > 0 ? (
        <Chip label="稼働中" color="success" size="small" />
      ) : (
        <Chip label="待機中" color="default" size="small" />
      );
  }
}

export function Header({ sseStatus, activeTuners, version, versionError }: Props) {
  return (
    <>
      <AppBar position="sticky" color="default" enableColorOnDark>
        <Toolbar variant="dense">
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            mirakc WebUI
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {connectionChip(sseStatus, activeTuners)}
            <Chip
              label={version ? `v${version}` : 'バージョン不明'}
              color={version ? 'primary' : 'default'}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Toolbar>
      </AppBar>
      {versionError && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          mirakc のバージョン情報を取得できません: {versionError}
        </Alert>
      )}
    </>
  );
}
