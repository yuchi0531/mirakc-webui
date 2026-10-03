import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { isMmtChannelType } from '../api/types';
import { EmptyState, SectionHeader } from '../components/EmptyState';
import { formatDateTime, formatDuration } from '../date';
import { channelStreamUrl, serviceStreamUrl } from '../api/client';

const GENRE_LV1_LABELS: Record<number, string> = {
  0: 'ニュース/報道',
  1: 'スポーツ',
  2: '情報/ワイドショー',
  3: 'ドラマ',
  4: '音楽',
  5: 'バラエティ',
  6: '映画',
  7: 'アニメ/特撮',
  8: 'ドキュメンタリー/教養',
  9: '劇場/公演',
  10: '趣味/教育',
  11: '福祉',
  12: '予備',
  13: '予備',
  14: '拡張',
  15: 'その他',
};

function genreLabel(lv1: number): string {
  return GENRE_LV1_LABELS[lv1] ?? `ジャンル ${lv1}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <Button size="small" startIcon={<ContentCopyIcon />} color={copied ? 'success' : 'primary'} onClick={copy}>
      {copied ? 'コピー済み' : 'コピー'}
    </Button>
  );
}

export function ProgramView() {
  const { programId } = useParams();
  const { programs, programsError, loadPrograms, services } = useAppState();

  // Ensure programs are loaded (deep link support).
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const program = useMemo(
    () => programs?.find((p) => String(p.id) === String(programId)),
    [programs, programId]
  );
  const service = useMemo(
    () => services?.find((s) => Number(s.serviceId) === Number(program?.serviceId)),
    [services, program]
  );

  if (programsError) {
    return <Alert severity="error">番組情報を取得できません: {programsError}</Alert>;
  }
  if (program === undefined) {
    return <EmptyState title="ロード中" loading={programs === null} description={programs ? '番組が見つかりません。' : undefined} />;
  }

  const channelType = service?.channel?.type ?? '';
  const isMmt = isMmtChannelType(channelType);
  const end = program.startAt + program.duration;

  const extended = program.extended ?? {};

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {program.name || '(番組名不明)'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
          {service && (
            <Chip
              label={service.name}
              component={RouterLink}
              to={`/epg/services/${encodeURIComponent(String(service.id))}`}
              clickable
              size="small"
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(program.startAt)} 〜 {formatDateTime(end)} ({formatDuration(program.duration)})
          </Typography>
        </Stack>
      </Box>

      {isMmt ? (
        <Alert severity="warning">
          BS4K/MMT チャンネルです。番組単位のストリームは mirakc では非対応(チャンネル/サービス単位のパススルーのみ)です。
        </Alert>
      ) : null}

      {(program.genres?.length ?? 0) > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {program.genres!.map((g, i) => (
            <Chip key={i} label={genreLabel(g.lv1)} size="small" variant="outlined" />
          ))}
        </Stack>
      )}

      {program.description && (
        <section>
          <SectionHeader>内容</SectionHeader>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {program.description}
            </Typography>
          </Card>
        </section>
      )}

      {Object.keys(extended).length > 0 && (
        <section>
          <SectionHeader>詳細情報</SectionHeader>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              {Object.entries(extended).map(([key, value]) => (
                <Box key={key}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {key}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </section>
      )}

      <section>
        <SectionHeader>メタ情報</SectionHeader>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              番組ID: {String(program.id)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              event_id: {program.eventId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SID: {program.serviceId} / NID: {program.networkId}
            </Typography>
          </Stack>
        </Card>
      </section>

      <section>
        <SectionHeader>ストリーム</SectionHeader>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              サービスストリーム
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}>
                {location.origin}
                {service ? serviceStreamUrl(service.id) : ''}
              </Typography>
              {service && <CopyButton value={`${location.origin}${serviceStreamUrl(service.id)}`} />}
            </Stack>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              チャンネルストリーム
            </Typography>
            {service ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}>
                  {location.origin}
                  {channelStreamUrl(service.channel?.type ?? '', service.channel?.channel ?? '')}
                </Typography>
                <CopyButton
                  value={`${location.origin}${channelStreamUrl(service.channel?.type ?? '', service.channel?.channel ?? '')}`}
                />
              </Stack>
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Stack>
        </Card>
      </section>
    </Stack>
  );
}
