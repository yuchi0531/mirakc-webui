import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { Service, SseStatus, Tuner, Version } from '../api/types';
import { getPrograms, isTunerBusy, tunerUsers } from '../api/client';
import { TunerList } from './TunerList';

/** Shown until the first successful fetch (empty-state text is reserved for 0 rows). */
function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

/** Small inline spinner used while an individual value is loading. */
function ValueLoading() {
  return <CircularProgress size={14} sx={{ display: 'block', my: '2px' }} />;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: 160, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Box>
    </Stack>
  );
}

const SSE_STATUS_LABELS: Record<SseStatus, string> = {
  connecting: '接続中',
  open: '接続済み',
  error: '切断',
};

interface Props {
  version: Version | null;
  tuners: Tuner[] | null;
  tunersError: string | null;
  services: Service[] | null;
  servicesError: string | null;
  sseStatus: SseStatus;
}

export function StatusTab({ version, tuners, tunersError, services, servicesError, sseStatus }: Props) {
  // Program count: fetched only once (not polled); failures are non-fatal.
  const [programCount, setProgramCount] = useState<number | null>(null);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getPrograms(controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return;
        setProgramCount(Array.isArray(list) ? list.length : 0);
        setProgramsError(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setProgramsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setProgramsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const serviceCounts = services
    ? {
        total: services.length,
        tv: services.filter((s) => Number(s.type) === 1).length,
        radio: services.filter((s) => Number(s.type) === 2).length,
        other: services.filter((s) => Number(s.type) !== 1 && Number(s.type) !== 2).length,
      }
    : null;

  const tunerCounts = tuners
    ? {
        total: tuners.length,
        busy: tuners.filter(isTunerBusy).length,
        users: tuners.reduce((sum, t) => sum + tunerUsers(t).length, 0),
      }
    : null;

  return (
    <Stack spacing={3}>
      <section>
        <Typography variant="h6" gutterBottom>
          システム情報
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <InfoRow label="mirakc バージョン">
            <Typography variant="body2">{version ? `v${version.current}` : '-'}</Typography>
          </InfoRow>
          <Divider sx={{ my: 0.5 }} />
          <InfoRow label="WebUI バージョン">
            <Typography variant="body2">v{__WEBUI_VERSION__}</Typography>
          </InfoRow>
          <Divider sx={{ my: 0.5 }} />
          <InfoRow label="接続状態">
            <Typography variant="body2">{SSE_STATUS_LABELS[sseStatus]}</Typography>
          </InfoRow>
          <Divider sx={{ my: 0.5 }} />
          <InfoRow label="サーバー">
            <Typography variant="body2">{location.origin}</Typography>
          </InfoRow>
        </Paper>
      </section>

      <section>
        <Typography variant="h6" gutterBottom>
          統計
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <InfoRow label="サービス数">
            {serviceCounts ? (
              <Typography variant="body2">
                {serviceCounts.total} 件 (テレビ {serviceCounts.tv} / ラジオ {serviceCounts.radio} /
                その他 {serviceCounts.other})
              </Typography>
            ) : servicesError ? (
              <Typography variant="body2">-</Typography>
            ) : (
              <ValueLoading />
            )}
          </InfoRow>
          <Divider sx={{ my: 0.5 }} />
          <InfoRow label="番組数">
            {programsLoading ? (
              <ValueLoading />
            ) : (
              <Typography variant="body2">
                {programsError || programCount === null ? '-' : `${programCount} 件`}
              </Typography>
            )}
          </InfoRow>
          <Divider sx={{ my: 0.5 }} />
          <InfoRow label="チューナー数">
            {tunerCounts ? (
              <Typography variant="body2">
                {tunerCounts.total} 台 (稼働中 {tunerCounts.busy} / 接続ユーザー数{' '}
                {tunerCounts.users})
              </Typography>
            ) : tunersError ? (
              <Typography variant="body2">-</Typography>
            ) : (
              <ValueLoading />
            )}
          </InfoRow>
        </Paper>
      </section>

      <section>
        <Typography variant="h6" gutterBottom>
          チューナー詳細
        </Typography>
        {tunersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            チューナー一覧を取得できません: {tunersError}
          </Alert>
        )}
        {tuners === null ? (tunersError ? null : <Loading />) : <TunerList tuners={tuners} />}
      </section>
    </Stack>
  );
}
