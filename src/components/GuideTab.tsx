import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
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

interface RowProps {
  label: string;
  value: string;
}

function GuideRow({ label, value }: RowProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    []
  );

  const onCopy = async () => {
    const ok = await copyText(value);
    setCopied(ok);
    setFailed(!ok);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
      resetTimer.current = null;
    }, 2000);
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
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
    </Paper>
  );
}

export function GuideTab() {
  // The SPA is served same-origin with the API by mirakc's built-in server.
  const base = location.origin;
  const rows: RowProps[] = [
    { label: 'mirakc URL', value: base },
    { label: 'API Docs (OpenAPI)', value: `${base}/api/docs` },
    { label: 'Swagger UI', value: `${base}/api/debug` },
    { label: 'IPTV M3U8', value: `${base}/api/iptv/playlist` },
    { label: 'XMLTV', value: `${base}/api/iptv/epg` },
    { label: 'ストリーム例', value: `${base}/api/services/{id}/stream` },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="h6">接続ガイド</Typography>
      {rows.map((row) => (
        <GuideRow key={row.label} {...row} />
      ))}
      <Alert severity="info">
        Config・Logs・Restart は mirakc に API が存在しないため、この WebUI では非対応です。
      </Alert>
    </Stack>
  );
}
