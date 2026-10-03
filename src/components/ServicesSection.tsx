import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  Chip,
  FormControlLabel,
  Stack,
  Checkbox,
  Tooltip,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isMmtChannelType } from '../api/types';
import { isTvService, SERVICE_TYPE_DATA } from '../api/classify';
import { logoUrl } from '../api/client';
import type { Service } from '../api/types';
import { EmptyState, SectionHeader } from './EmptyState';

type Filter = 'dtv' | 'data' | 'other';

function category(service: Service): Filter {
  if (isTvService(service.type)) return 'dtv';
  if (Number(service.type) === SERVICE_TYPE_DATA) return 'data';
  return 'other';
}

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

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const id = String(service.id);
  const type = service.channel?.type ?? '';
  const channelText = `${type} ${service.channel?.channel ?? ''}`.trim();
  const tooltip = [
    `#${id}`,
    `SID: ${service.serviceId}`,
    `NID: ${service.networkId}`,
    `種別: ${type || '?'}`,
    channelText ? `チャンネル: ${channelText}` : '',
    service.remoteControlKeyId !== undefined ? `リモコンキーID: ${service.remoteControlKeyId}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardActionArea onClick={onClick} sx={{ p: 1.5, height: '100%' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              component="img"
              src={logoUrl(id)}
              alt=""
              sx={{
                width: 48,
                height: 48,
                objectFit: 'contain',
                flexShrink: 0,
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                  {service.name || '(名称不明)'}
                </Typography>
                {isMmtChannelType(type) && (
                  <Chip label="4K" size="small" color="secondary" variant="outlined" />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {channelText || '-'}
              </Typography>
              {epgIndicator(service)}
            </Box>
          </Stack>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
}

interface Props {
  services: Service[] | null;
  servicesError: string | null;
}

export function ServicesSection({ services, servicesError }: Props) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<Filter, boolean>>({
    dtv: true,
    data: false,
    other: false,
  });

  const grouped = useMemo(() => {
    const map: Record<Filter, Service[]> = { dtv: [], data: [], other: [] };
    for (const s of services ?? []) map[category(s)].push(s);
    return map;
  }, [services]);

  const shown = useMemo(
    () => (['dtv', 'data', 'other'] as Filter[]).flatMap((f) => (filters[f] ? grouped[f] : [])),
    [filters, grouped]
  );

  const toggle = (f: Filter) => setFilters((prev) => ({ ...prev, [f]: !prev[f] }));

  return (
    <section>
      <SectionHeader>サービス ({services?.length ?? 0})</SectionHeader>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControlLabel
          control={<Checkbox size="small" checked={filters.dtv} onChange={() => toggle('dtv')} />}
          label={`テレビ (${grouped.dtv.length})`}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={filters.data} onChange={() => toggle('data')} />}
          label={`データ (${grouped.data.length})`}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={filters.other} onChange={() => toggle('other')} />}
          label={`その他 (${grouped.other.length})`}
        />
      </Stack>

      {servicesError && <Alert severity="error">サービス一覧を取得できません: {servicesError}</Alert>}

      {services === null ? (
        servicesError ? null : (
          <EmptyState title="ロード中" loading />
        )
      ) : shown.length === 0 ? (
        <EmptyState title="放送サービスなし" description="表示する種別を選択してください。" />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 1.5,
          }}
        >
          {shown.map((s) => (
            <ServiceCard
              key={String(s.id)}
              service={s}
              onClick={() => navigate(`/epg/services/${encodeURIComponent(String(s.id))}`)}
            />
          ))}
        </Box>
      )}
    </section>
  );
}
