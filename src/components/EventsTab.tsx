import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { SseEvent } from '../api/types';

const MAX_JSON_CHARS = 2000;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ja-JP', { hour12: false });
}

function prettyJson(data: unknown): string {
  let text: string;
  try {
    text = JSON.stringify(data, null, 2) ?? String(data);
  } catch {
    text = String(data);
  }
  if (text.length > MAX_JSON_CHARS) return `${text.slice(0, MAX_JSON_CHARS)}\n… (省略)`;
  return text;
}

interface Props {
  events: SseEvent[];
  error: string | null;
}

export function EventsTab({ events, error }: Props) {
  return (
    <Stack spacing={2}>
      {error && <Alert severity="warning">{error}</Alert>}
      {events.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          イベントはまだありません。
        </Typography>
      ) : (
        events.map((event) => (
          <Paper key={event.seq} variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {formatTime(event.receivedAt)}
              </Typography>
              <Chip label={event.type} size="small" color="primary" variant="outlined" />
            </Stack>
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: 'monospace',
                fontSize: 12,
                color: 'text.secondary',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {prettyJson(event.data)}
            </Box>
          </Paper>
        ))
      )}
    </Stack>
  );
}
