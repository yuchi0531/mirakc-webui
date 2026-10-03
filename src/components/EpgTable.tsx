import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import type { Program, Service } from '../api/types';
import { isMmtChannelType } from '../api/types';
import { genreBackground } from '../theme';

const PX_PER_MIN = 2; // 120px / hour
const HOURS = 28; // 0:00–28:00 like the official UI
const AXIS_WIDTH = 52;
const COLUMN_WIDTH = 170;
const HOUR_HEIGHT = 60 * PX_PER_MIN;

/** Format a duration position as `H:MM` relative to the column day (0:00–28:00). */
function relativeTime(offsetMs: number): string {
  const totalMinutes = Math.floor(offsetMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export interface EpgColumn {
  key: string;
  service: Service;
  /** JST day start (epoch ms) used to position programs in this column. */
  dayStartMs: number;
  /** Optional sub-label (e.g. weekday for the weekly view). */
  label?: string;
}

interface Props {
  columns: EpgColumn[];
  programs: Program[];
  onProgramClick: (program: Program) => void;
}

export function EpgTable({ columns, programs, onProgramClick }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Programs indexed by serviceId for quick lookup.
  const byService = useMemo(() => {
    const map = new Map<number, Program[]>();
    for (const p of programs) {
      const list = map.get(p.serviceId);
      if (list) list.push(p);
      else map.set(p.serviceId, [p]);
    }
    return map;
  }, [programs]);

  const scrollToNow = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Position of "now" relative to the first column's day start.
    const base = columns[0]?.dayStartMs;
    const hours = base !== undefined ? (now - base) / 3_600_000 : 0;
    const clamped = Math.max(0, Math.min(HOURS - 1, hours));
    el.scrollTo({ top: clamped * HOUR_HEIGHT - el.clientHeight / 3, behavior: 'smooth' });
  };

  if (columns.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">放送サービスがありません。</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
        <Chip label="現在時刻へ" size="small" onClick={scrollToNow} clickable />
      </Box>
      <Box
        ref={scrollRef}
        sx={{
          position: 'relative',
          overflow: 'auto',
          maxHeight: '70vh',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        {/* Sticky header: column labels */}
        <Box
          sx={{
            display: 'flex',
            position: 'sticky',
            top: 0,
            zIndex: 3,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ width: AXIS_WIDTH, flexShrink: 0 }} />
          {columns.map((col) => (
            <Box
              key={col.key}
              sx={{
                width: COLUMN_WIDTH,
                flexShrink: 0,
                px: 1,
                py: 0.5,
                borderLeft: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 0,
              }}
            >
              <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                {col.service.name || '(名称不明)'}
              </Typography>
              {isMmtChannelType(col.service.channel?.type) && (
                <Chip label="4K" size="small" color="secondary" variant="outlined" />
              )}
              {col.label && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {col.label}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Body: time axis + program columns */}
        <Box sx={{ display: 'flex', position: 'relative' }}>
          {/* Time axis */}
          <Box sx={{ width: AXIS_WIDTH, flexShrink: 0, position: 'relative', height: HOURS * HOUR_HEIGHT }}>
            {Array.from({ length: HOURS }, (_, h) => (
              <Box
                key={h}
                sx={{
                  position: 'absolute',
                  top: h * HOUR_HEIGHT,
                  right: 4,
                  transform: 'translateY(-50%)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {h}:00
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Columns */}
          {columns.map((col) => (
            <Box
              key={col.key}
              sx={{
                position: 'relative',
                width: COLUMN_WIDTH,
                flexShrink: 0,
                height: HOURS * HOUR_HEIGHT,
                borderLeft: 1,
                borderColor: 'divider',
                backgroundImage: (theme) =>
                  `repeating-linear-gradient(to bottom, ${theme.palette.divider} 0, ${theme.palette.divider} 1px, transparent 1px, transparent ${HOUR_HEIGHT}px)`,
              }}
            >
              {(byService.get(col.service.serviceId) ?? []).map((program) => {
                const startMs = program.startAt;
                const endMs = startMs + program.duration;
                const colStart = col.dayStartMs;
                const colEnd = colStart + HOURS * 3_600_000;
                if (endMs <= colStart || startMs >= colEnd) return null;
                const clampedStart = Math.max(startMs, colStart);
                const top = ((clampedStart - colStart) / 3_600_000) * HOUR_HEIGHT;
                const height = ((Math.min(endMs, colEnd) - clampedStart) / 3_600_000) * HOUR_HEIGHT;
                const bg = genreBackground(program.genres?.[0]?.lv1);
                return (
                  <Tooltip
                    key={String(program.id)}
                    title={`${relativeTime(startMs - colStart)}-${relativeTime(endMs - colStart)} ${
                      program.name ?? ''
                    }`}
                    placement="top"
                  >
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => onProgramClick(program)}
                      onKeyDown={(e) => e.key === 'Enter' && onProgramClick(program)}
                      sx={{
                        position: 'absolute',
                        top,
                        left: 2,
                        right: 2,
                        height: Math.max(height - 2, 18),
                        overflow: 'hidden',
                        cursor: 'pointer',
                        borderRadius: 0.5,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: bg ?? 'background.paper',
                        color: '#111',
                        p: 0.5,
                        '&:hover': { outline: '2px solid', outlineColor: 'primary.main' },
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.2 }}>
                        {relativeTime(clampedStart - colStart)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', lineHeight: 1.2, whiteSpace: 'normal', wordBreak: 'break-all' }}
                      >
                        {program.name || '(番組名不明)'}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}

              {/* Current-time line: only on the column whose day contains now. */}
              {now >= col.dayStartMs &&
                now < col.dayStartMs + HOURS * 3_600_000 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: ((now - col.dayStartMs) / 3_600_000) * HOUR_HEIGHT,
                      height: 2,
                      bgcolor: 'error.main',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  />
                )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
