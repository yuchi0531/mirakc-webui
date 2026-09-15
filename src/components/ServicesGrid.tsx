import { Avatar, Box, Paper, Tooltip, Typography } from '@mui/material';
import type { Service } from '../api/types';
import { logoUrl } from '../api/client';

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const id = String(service.id);
  const tooltip = [
    `ID: ${id}`,
    `Service ID: ${service.serviceId}`,
    `Network ID: ${service.networkId}`,
    `チャンネル: ${service.channel?.type ?? '?'} ${service.channel?.channel ?? ''}`.trim(),
    service.remoteControlKeyId !== undefined ? `リモコンキーID: ${service.remoteControlKeyId}` : '',
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
          <Typography variant="body1" noWrap>
            {service.name || '(名称不明)'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {service.channel?.type ?? ''} {service.channel?.channel ?? ''}
          </Typography>
          {service.epgReady !== undefined && (
            <Typography variant="caption" color={service.epgReady ? 'success.main' : 'text.secondary'}>
              {service.epgReady ? 'EPG 取得済み' : 'EPG 未取得'}
            </Typography>
          )}
        </Box>
      </Paper>
    </Tooltip>
  );
}

interface Props {
  services: Service[];
}

export function ServicesGrid({ services }: Props) {
  const tvServices = services.filter((s) => Number(s.type) === 1);
  if (tvServices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        サービスが見つかりません。
      </Typography>
    );
  }
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 2,
      }}
    >
      {tvServices.map((s) => (
        <ServiceCard key={String(s.id)} service={s} />
      ))}
    </Box>
  );
}
