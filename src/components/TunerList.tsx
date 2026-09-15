import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import type { Tuner } from '../api/types';
import { tunerUsers } from '../api/client';

const TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'default'> = {
  GR: 'primary',
  BS: 'secondary',
  CS: 'success',
};

function typeChip(type: string) {
  return (
    <Chip
      key={type}
      label={type.toUpperCase()}
      size="small"
      color={TYPE_COLORS[type.toUpperCase()] ?? 'default'}
      variant="outlined"
    />
  );
}

interface Props {
  tuners: Tuner[];
}

export function TunerList({ tuners }: Props) {
  if (tuners.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        チューナーが見つかりません。
      </Typography>
    );
  }
  const sorted = [...tuners].sort((a, b) => a.index - b.index);
  return (
    <Stack spacing={2}>
      {sorted.map((tuner) => {
        const users = tunerUsers(tuner);
        const busy = tuner.isFree === false || users.length > 0;
        return (
          <Paper key={tuner.index} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                #{tuner.index}
              </Typography>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                {tuner.name}
              </Typography>
              {tuner.types?.map(typeChip)}
              <Chip
                label={busy ? '使用中' : '空き'}
                size="small"
                color={busy ? 'warning' : 'success'}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              コマンド: {tuner.command}
              {tuner.pid != null ? ` (pid ${tuner.pid})` : ''}
            </Typography>
            {users.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.5}>
                  {users.map((user, i) => (
                    <Box key={`${user.id}-${i}`} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={`優先度 ${user.priority}`} size="small" variant="outlined" />
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {user.id}
                        {user.agent ? ` (${user.agent})` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}
