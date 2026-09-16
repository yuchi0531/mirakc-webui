import { Alert, Avatar, Box, CircularProgress, Paper, Stack, Tooltip, Typography } from '@mui/material';
import type { Service } from '../api/types';
import { logoUrl } from '../api/client';

/** Service categories in display order. Missing/unknown types fall into その他. */
const CATEGORIES: { label: string; matches: (type: number) => boolean }[] = [
  { label: 'テレビ', matches: (type) => type === 1 },
  { label: 'ラジオ', matches: (type) => type === 2 },
  { label: 'データ', matches: (type) => type === 3 },
  { label: 'その他', matches: (type) => type !== 1 && type !== 2 && type !== 3 },
];

/** Shown until the first successful fetch (empty-state text is reserved for 0 rows). */
function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

/** EPG state is only rendered when the API provides the field. */
function epgIndicator(service: Service) {
  if (service.epgReady !== undefined) {
    return (
      <Typography variant="caption" color={service.epgReady ? 'success.main' : 'text.secondary'}>
        {service.epgReady ? 'EPG 取得済み' : 'EPG 未取得'}
      </Typography>
    );
  }
  if (service.epgUpdated !== undefined) {
    return (
      <Typography variant="caption" color={service.epgUpdated ? 'success.main' : 'text.secondary'}>
        {service.epgUpdated ? 'EPG 更新済み' : 'EPG 未更新'}
      </Typography>
    );
  }
  return null;
}

function ServiceCard({ service }: { service: Service }) {
  const id = String(service.id);
  const channelText = `${service.channel?.type ?? ''} ${service.channel?.channel ?? ''}`.trim();
  const remoteKey =
    service.remoteControlKeyId !== undefined ? `リモコンキーID: ${service.remoteControlKeyId}` : '';
  const tooltip = [
    `ID: ${id}`,
    `Service ID: ${service.serviceId}`,
    `Network ID: ${service.networkId}`,
    `チャンネル: ${channelText || '?'}`,
    remoteKey,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'default',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        {/* MUI Avatar preloads src with `new Image()` and shows children on load error. */}
        <Avatar
          variant="rounded"
          src={logoUrl(id)}
          sx={{ width: 56, height: 56, bgcolor: 'background.default', color: 'primary.main' }}
        >
          {service.name?.charAt(0) ?? '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 700 }}>
            {service.name || '(名称不明)'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {[channelText, remoteKey].filter(Boolean).join(' / ') || '-'}
          </Typography>
          {epgIndicator(service)}
        </Box>
      </Paper>
    </Tooltip>
  );
}

interface Props {
  services: Service[] | null;
  servicesError: string | null;
}

export function ChannelListTab({ services, servicesError }: Props) {
  return (
    <Stack spacing={3}>
      {servicesError && (
        <Alert severity="error">サービス一覧を取得できません: {servicesError}</Alert>
      )}
      {services === null ? (
        servicesError ? null : (
          <Loading />
        )
      ) : services.length === 0 ? (
        servicesError ? null : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            サービスが見つかりません。
          </Typography>
        )
      ) : (
        CATEGORIES.map(({ label, matches }) => {
          const group = services.filter((s) => matches(Number(s.type)));
          if (group.length === 0) return null;
          return (
            <section key={label}>
              <Typography variant="h6" gutterBottom>
                {label} ({group.length})
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 2,
                }}
              >
                {group.map((s) => (
                  <ServiceCard key={String(s.id)} service={s} />
                ))}
              </Box>
            </section>
          );
        })
      )}
    </Stack>
  );
}
