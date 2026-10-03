import { Alert, Divider, Card, Stack, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import type { StatusIconKey } from '../state/AppState';
import { SectionHeader } from '../components/EmptyState';
import { ServicesSection } from '../components/ServicesSection';
import { TunersSection } from '../components/TunersSection';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 170, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Box>
    </Stack>
  );
}

const STATUS_LABEL: Record<StatusIconKey, string> = {
  normal: '待機中',
  active: '稼働中',
  offline: '切断',
};

function StatusSection() {
  const {
    version,
    versionError,
    statusIconKey,
    services,
    servicesError,
    tuners,
    tunersError,
    programs,
    activeTuners,
  } = useAppState();

  const serviceCounts = services
    ? {
        total: services.length,
        tv: services.filter((s) => Number(s.type) === 1).length,
        radio: services.filter((s) => Number(s.type) === 2).length,
      }
    : null;

  const tunerCounts = tuners ? { total: tuners.length, busy: activeTuners } : null;

  return (
    <section>
      <SectionHeader>ステータス</SectionHeader>
      <Card variant="outlined" sx={{ p: 2 }}>
        <InfoRow label="mirakc バージョン">
          <Typography variant="body2">
            {version ? `v${version.current}` : versionError ? '-' : '...'}
          </Typography>
        </InfoRow>
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="WebUI バージョン">
          <Typography variant="body2">v{__WEBUI_VERSION__}</Typography>
        </InfoRow>
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="接続状態">
          <Typography variant="body2">{STATUS_LABEL[statusIconKey]}</Typography>
        </InfoRow>
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="サーバー">
          <Typography variant="body2">{location.origin}</Typography>
        </InfoRow>
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="サービス数">
          <Typography variant="body2">
            {serviceCounts
              ? `${serviceCounts.total} 件 (テレビ ${serviceCounts.tv} / ラジオ ${serviceCounts.radio})`
              : servicesError
                ? '-'
                : '...'}
          </Typography>
        </InfoRow>
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="番組数">
          <Typography variant="body2">{programs === null ? '-' : `${programs.length} 件`}</Typography>
        </InfoRow>
        <Divider sx={{ my: 0.5 }} />
        <InfoRow label="チューナー数">
          <Typography variant="body2">
            {tunerCounts
              ? `${tunerCounts.total} 台 (稼働中 ${tunerCounts.busy})`
              : tunersError
                ? '-'
                : '...'}
          </Typography>
        </InfoRow>
      </Card>
    </section>
  );
}

export function HomeView() {
  const navigate = useNavigate();
  const { services, servicesError, tuners, tunersError } = useAppState();

  return (
    <Stack spacing={4}>
      <StatusSection />
      <ServicesSection services={services} servicesError={servicesError} />
      <TunersSection tuners={tuners} tunersError={tunersError} />
      <Alert
        severity="info"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/about')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/about');
          }
        }}
        sx={{ cursor: 'pointer' }}
      >
        接続ガイドや制限事項は「mirakc WebUI について」に移動しました。
      </Alert>
    </Stack>
  );
}
