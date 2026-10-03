import { useEffect, useMemo } from 'react';
import { Alert, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { EmptyState, SectionHeader } from '../components/EmptyState';
import type { Program } from '../api/types';
import { formatShortDateTime, formatDuration } from '../date';

/** NFKC normalize + katakana→hiragana for lenient matching. */
function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .toLowerCase();
}

function programHaystack(program: Program): string {
  const extended = program.extended ? Object.values(program.extended).join(' ') : '';
  const genres = program.genres?.map((g) => `${g.lv1}-${g.lv2}`).join(' ') ?? '';
  return normalizeText(`${program.name ?? ''} ${program.description ?? ''} ${extended} ${genres}`);
}

export function SearchView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { programs, programsError, loadPrograms } = useAppState();

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const query = searchParams.get('q')?.trim() ?? '';

  const results = useMemo(() => {
    if (!query || programs === null) return [];
    const needle = normalizeText(query);
    return programs
      .filter((p) => programHaystack(p).includes(needle))
      .sort((a, b) => a.startAt - b.startAt);
  }, [query, programs]);

  return (
    <Stack spacing={3}>
      <SectionHeader>検索 {query ? `"${query}" (${results.length}件)` : ''}</SectionHeader>

      {programsError && <Alert severity="error">番組情報を取得できません: {programsError}</Alert>}

      {!query ? (
        <EmptyState title="検索キーワードを入力してください" description="上部の検索ボックスから番組を検索できます。" />
      ) : programs === null ? (
        programsError ? null : (
          <EmptyState title="ロード中" loading />
        )
      ) : results.length === 0 ? (
        <EmptyState title="該当する番組がありません" description="キーワードを変えて再検索してください。" />
      ) : (
        <Stack spacing={1.5}>
          {results.map((program) => (
            <Card key={String(program.id)} variant="outlined">
              <CardActionArea
                onClick={() => navigate(`/epg/programs/${encodeURIComponent(String(program.id))}`)}
                sx={{ p: 1.5 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Chip label={`${formatShortDateTime(program.startAt)} (${formatDuration(program.duration)})`} size="small" />
                  <Typography variant="caption" color="text.secondary">
                    SID {program.serviceId}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {program.name || '(番組名不明)'}
                </Typography>
                {program.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {program.description}
                  </Typography>
                )}
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
