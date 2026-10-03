import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Checkbox,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
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

/** Small EPG state icon (Mirakurun official uses refresh/tick/time icons). */
function EpgStatusIcon({ service }: { service: Service }) {
  if (service.epgReady === undefined && service.epgUpdated === undefined) return null;
  const ready = service.epgReady ?? service.epgUpdated ?? false;
  return (
    <Tooltip title={ready ? 'EPG 取得済み' : 'EPG 未取得'} placement="top">
      <Box component="span" sx={{ display: 'inline-flex', flexShrink: 0 }}>
        {ready ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main' }} />
        ) : (
          <ScheduleOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
        )}
      </Box>
    </Tooltip>
  );
}

function ServiceItem({ service, onClick }: { service: Service; onClick: () => void }) {
  const id = String(service.id);
  const type = service.channel?.type ?? '';
  const channelText = `${type} ${service.channel?.channel ?? ''}`.trim();
  const tooltip = [
    `#${id}`,
    `SID: 0x${service.serviceId.toString(16).toUpperCase()} (${service.serviceId})`,
    `NID: 0x${service.networkId.toString(16).toUpperCase()} (${service.networkId})`,
    `種別: ${type || '?'}`,
    channelText ? `チャンネル: ${channelText}` : '',
    service.remoteControlKeyId !== undefined ? `リモコンキーID: ${service.remoteControlKeyId}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <Box
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1,
          py: 0.5,
          minWidth: 0,
          borderRadius: 0.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {/* mirakc only has logo data for services listed in resource.logos. */}
        {service.hasLogoData === true && (
          <Box
            component="img"
            src={logoUrl(id)}
            alt=""
            sx={{ width: 28, height: 20, objectFit: 'contain', flexShrink: 0, borderRadius: 0.25 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        )}
        <Typography
          variant="body2"
          noWrap
          sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500 }}
        >
          {service.name || '(名称不明)'}
        </Typography>
        {isMmtChannelType(type) && (
          <Chip
            label="4K"
            color="secondary"
            variant="outlined"
            sx={{ height: 16, fontSize: 10, flexShrink: 0, '& .MuiChip-label': { px: 0.5 } }}
          />
        )}
        <EpgStatusIcon service={service} />
      </Box>
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 0.5,
          }}
        >
          {shown.map((s) => (
            <ServiceItem
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
