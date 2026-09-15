import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { Service, SseEvent, Tuner, Version } from '../api/types';
import { getServices } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { ServicesGrid } from './ServicesGrid';
import { TunerList } from './TunerList';

const SERVICES_POLL_MS = 60_000;

interface Props {
  version: Version | null;
  tuners: Tuner[];
  tunersError: string | null;
  sseEvents: SseEvent[];
}

export function StatusTab({ version, tuners, tunersError, sseEvents }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const loadServices = useCallback(() => {
    getServices()
      .then((list) => {
        setServices(Array.isArray(list) ? list : []);
        setServicesError(null);
      })
      .catch((err: unknown) => {
        setServicesError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  // Initial fetch + periodic refresh (skipped while hidden).
  usePolling(loadServices, SERVICES_POLL_MS);

  // Refresh on the relevant SSE event (full list: no verified per-service GET).
  const lastEventRef = useRef<SseEvent | null>(null);
  useEffect(() => {
    const newest = sseEvents[0];
    if (!newest || newest === lastEventRef.current) return;
    lastEventRef.current = newest;
    if (newest.type === 'epg.programs-updated') loadServices();
  }, [sseEvents, loadServices]);

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          バージョン情報
        </Typography>
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <Typography variant="body2">
            mirakc:{' '}
            <Chip
              label={version ? `v${version.current}` : '不明'}
              size="small"
              color={version ? 'primary' : 'default'}
              variant="outlined"
            />
          </Typography>
          <Typography variant="body2">
            WebUI: <Chip label={`v${__WEBUI_VERSION__}`} size="small" variant="outlined" />
          </Typography>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="text.secondary">
          mirakc の /api/status は常に空のため、追加のステータス情報はありません。
        </Typography>
      </Paper>

      <section>
        <Typography variant="h6" gutterBottom>
          サービス
        </Typography>
        {servicesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            サービス一覧を取得できません: {servicesError}
          </Alert>
        )}
        <ServicesGrid services={services} />
      </section>

      <section>
        <Typography variant="h6" gutterBottom>
          チューナー
        </Typography>
        {tunersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            チューナー一覧を取得できません: {tunersError}
          </Alert>
        )}
        <TunerList tuners={tuners} />
      </section>
    </Stack>
  );
}
