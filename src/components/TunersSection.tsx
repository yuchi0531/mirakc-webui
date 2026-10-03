import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Tuner } from '../api/types';
import { isTunerBusy, tunerUsers } from '../api/client';
import { EmptyState, SectionHeader } from './EmptyState';

const TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'default'> = {
  GR: 'primary',
  BS: 'secondary',
  CS: 'success',
  SKY: 'warning',
  BS4K: 'secondary',
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

/** miraview と同じ色分け: 障害 → グレー、空き → 緑、使用中(優先度 0 以下) → 黄、使用中 → 赤。 */
function statusColor(tuner: Tuner): string {
  if (tuner.isFault === true) return 'grey.600';
  if (!isTunerBusy(tuner)) return 'success.main';
  const priorities = tunerUsers(tuner).map((u) => u.priority);
  return priorities.length > 0 && Math.min(...priorities) <= 0 ? 'warning.main' : 'error.main';
}

function TunerCard({ tuner }: { tuner: Tuner }) {
  const users = tunerUsers(tuner);
  const busy = isTunerBusy(tuner);

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: statusColor(tuner),
            flexShrink: 0,
          }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          #{tuner.index}
        </Typography>
        <Typography variant="subtitle1" sx={{ mr: 1 }}>
          {tuner.name}
        </Typography>
        {tuner.types?.map(typeChip)}
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}
      >
        {tuner.command || '-'}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        pid: {tuner.pid ?? '-'}
      </Typography>

      {busy && users.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Client ID</TableCell>
                <TableCell>優先度</TableCell>
                <TableCell>Agent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, i) => (
                <TableRow key={`${user.id}-${i}`}>
                  <TableCell sx={{ wordBreak: 'break-all' }}>{user.id}</TableCell>
                  <TableCell>{user.priority}</TableCell>
                  <TableCell>{user.agent ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}

interface Props {
  tuners: Tuner[] | null;
  tunersError: string | null;
}

export function TunersSection({ tuners, tunersError }: Props) {
  const sorted = tuners ? [...tuners].sort((a, b) => a.index - b.index) : null;

  return (
    <section>
      <SectionHeader>チューナー ({tuners?.length ?? 0})</SectionHeader>
      {tunersError && <Alert severity="error">チューナー一覧を取得できません: {tunersError}</Alert>}
      {tuners === null ? (
        tunersError ? null : (
          <EmptyState title="ロード中" loading />
        )
      ) : sorted!.length === 0 ? (
        <EmptyState title="チューナーなし" description="config.yml に tuners を定義してください。" />
      ) : (
        <Stack spacing={1.5}>
          {sorted!.map((tuner) => (
            <TunerCard key={tuner.index} tuner={tuner} />
          ))}
        </Stack>
      )}
    </section>
  );
}
