import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAppState } from '../state/AppState';
import { SectionHeader } from '../components/EmptyState';
import { EventsTab } from '../components/EventsTab';
import { DEFAULT_DECODE_SERVER_ORIGIN } from '../api/types';

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function GuideRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const onCopy = async () => {
    const ok = await copyText(value);
    setCopied(ok);
    setFailed(!ok);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
      timerRef.current = null;
    }, 2000);
  };

  return (
    <Card variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <Typography variant="body2" sx={{ minWidth: 160, fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ flexGrow: 1, fontFamily: 'monospace', wordBreak: 'break-all', color: 'text.secondary' }}
        >
          {value}
        </Typography>
        <Button
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={onCopy}
          color={failed ? 'error' : copied ? 'success' : 'primary'}
        >
          {failed ? '失敗' : copied ? 'コピー済み' : 'コピー'}
        </Button>
      </Stack>
    </Card>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      <Card variant="outlined" sx={{ p: 2 }}>
        {children}
      </Card>
    </section>
  );
}

export function AboutView() {
  const { version, versionError, services, events, sseError } = useAppState();
  const [showEvents, setShowEvents] = useState(false);
  const base = location.origin;

  // Example channel: prefer a BS4K service if one exists, else the first TV service.
  const sample = services?.find((s) => (s.channel?.type ?? '').toUpperCase() === 'BS4K') ?? services?.[0];
  const sampleChannelType = sample?.channel?.type ?? 'BS4K';
  const sampleChannel = sample?.channel?.channel ?? '45328';

  const rows = [
    { label: 'mirakc URL', value: base },
    { label: 'API Docs (OpenAPI)', value: `${base}/api/docs` },
    { label: 'Swagger UI', value: `${base}/api/debug` },
    { label: 'IPTV M3U8', value: `${base}/api/iptv/playlist` },
    { label: 'XMLTV', value: `${base}/api/iptv/epg` },
    { label: 'チャンネルストリーム', value: `${base}/api/channels/${sampleChannelType}/${sampleChannel}/stream` },
    { label: 'サービスストリーム', value: `${base}/api/services/{id}/stream` },
  ];

  const pinTunerCurl = `curl -H 'X-Mirakc-Tuner: <tuner-name>' '${base}/api/channels/${sampleChannelType}/${sampleChannel}/stream' -o /dev/null`;

  return (
    <Stack spacing={4}>
      <InfoBlock title="mirakc WebUI について">
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip label={`mirakc v${version?.current ?? '..'}`} color="primary" variant="outlined" />
            <Chip label={`WebUI v${__WEBUI_VERSION__}`} variant="outlined" />
            <Chip label="Mirakurun 互換" variant="outlined" />
          </Stack>
          {versionError && <Alert severity="warning">{versionError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            この UI は mirakc 内蔵 Web サーバの <code>server.mounts</code> で配信される静的 SPA です。
            バックエンドを追加せず same-origin でのみ動作します。
          </Typography>
        </Stack>
      </InfoBlock>

      <InfoBlock title="接続ガイド">
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <GuideRow key={row.label} {...row} />
          ))}
        </Stack>
      </InfoBlock>

      <InfoBlock title="mirakc-BS4K 固有機能">
        <Stack spacing={1.5}>
          <Typography variant="body2">
            この WebUI は mirakc-BS4K フォークの BS4K / MMT 対応を認識します。
            チャンネル種別 <code>BS4K</code> のサービスは「4K」バッジ付きで表示され、
            <code>channel</code> は StreamID(10進または 0x 16進)としてそのまま扱われます。
          </Typography>
          <Divider />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            CATV (ケーブルテレビ) チャンネル種別
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <code>CATV</code> はケーブルテレビのチャンネル種別で、GR/BS/CS/SKY と同じ MPEG-TS
            パイプラインを使います。チャンネル番号は <code>C17</code> のような英数字(CATV 形式)も指定でき、
            <code>tsmf-rel-ts</code> で多重フレームから相対 TS 番号を抽出できます。BS4K と違い番組単位の
            ストリームも利用できます。EPG 番組表・サービス一覧のチャンネル種別フィルタに <code>CATV</code> として現れます。
          </Typography>
          <Divider />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            チューナー固定 (X-Mirakc-Tuner)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            チャンネルストリームのみ、<code>X-Mirakc-Tuner</code> ヘッダで使用チューナーを厳密固定できます
            (routes を無視、未知名は 400)。チューナー名は「ホーム」のチューナー一覧で確認できます。
          </Typography>
          <GuideRow label="curl 例" value={pinTunerCurl} />
          <Divider />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            BS4K のパススルー構成
          </Typography>
          <Typography variant="body2" color="text.secondary">
            BS4K はデコード済み TLV を外部サーバから受け取るパススルー配信です。mirakc 自身はデコードしません
            (外部の mirakc-arib-tlv サーバは別途必要。例: <code>{DEFAULT_DECODE_SERVER_ORIGIN}</code>)。
            番組単位のストリームは非対応で、チャンネル/サービス単位のみ利用できます。
          </Typography>
          <Divider />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            routes / disabled について
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <code>channels[].routes</code>(CATV 等へのフォールバック)と <code>disabled</code> は
            サーバ内部の設定専用で、Web API には公開されません。そのため本 UI では表示・編集できません。
          </Typography>
        </Stack>
      </InfoBlock>

      <InfoBlock title="制限事項 (mirakc に API が無いため非対応)">
        <Stack spacing={0.5}>
          <Typography variant="body2">・設定編集 (Config) — <code>/api/config</code> なし</Typography>
          <Typography variant="body2">・ログ (Logs) — <code>/api/log</code> なし</Typography>
          <Typography variant="body2">・ジョブ (Jobs) — <code>/api/jobs</code> なし</Typography>
          <Typography variant="body2">・再起動 — <code>/api/restart</code> なし</Typography>
          <Typography variant="body2">・チューナープロセスの kill — <code>DELETE /api/tuners/&#123;index&#125;/process</code> なし</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            これらは最新版 Mirakurun 公式 UI には存在しますが、mirakc に対応 API が無いため本 UI ではメニューに表示しません。
          </Typography>
        </Stack>
      </InfoBlock>

      <section>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SectionHeader>イベント (SSE)</SectionHeader>
          <IconButton size="small" onClick={() => setShowEvents((v) => !v)} aria-label="イベント表示切替">
            {showEvents ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
        <Collapse in={showEvents}>
          <Box sx={{ pt: 2 }}>
            <EventsTab events={events} error={sseError} />
          </Box>
        </Collapse>
      </section>
    </Stack>
  );
}
