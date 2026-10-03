import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { EmptyState, SectionHeader } from '../components/EmptyState';
import { EpgTable } from '../components/EpgTable';
import type { EpgColumn } from '../components/EpgTable';
import type { Program, Service } from '../api/types';
import { KNOWN_CHANNEL_TYPES } from '../api/types';
import { dayStart, formatDayTab } from '../date';

const DAY_TABS = 8;
const ALL_TYPES = '全波';

interface DayTab {
  day: number;
  label: string;
  isToday: boolean;
}

/** Build day tabs from today (offset 0..7). Computed per render so the tabs
 *  roll over correctly if the SPA stays open past midnight (cheap: 8 luxon calls). */
function buildDayTabs(): DayTab[] {
  return Array.from({ length: DAY_TABS }, (_, i) => {
    const day = dayStart(i);
    return { day, label: formatDayTab(day), isToday: i === 0 };
  });
}

function TypeFilter({
  types,
  value,
  onChange,
}: {
  types: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const ordered = [
    ALL_TYPES,
    ...KNOWN_CHANNEL_TYPES.filter((t) => types.includes(t)),
    ...types.filter((t) => !(KNOWN_CHANNEL_TYPES as readonly string[]).includes(t)),
  ];
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {ordered.map((t) => (
        <Chip
          key={t}
          label={t}
          size="small"
          color={value === t ? 'primary' : 'default'}
          variant={value === t ? 'filled' : 'outlined'}
          onClick={() => onChange(t)}
        />
      ))}
    </Stack>
  );
}

export function EPGView() {
  const { globalServiceId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { services, servicesError, programs, programsError, loadPrograms } =
    useAppState();
  const dayTabs = buildDayTabs();

  // Ensure programs are loaded at least once.
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const selectedService = useMemo(
    () => services?.find((s) => String(s.id) === String(globalServiceId)),
    [services, globalServiceId]
  );

  // Channel type filter is only relevant for the multi-service day grid.
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const s of services ?? []) if (s.channel?.type) set.add(s.channel.type);
    const known = KNOWN_CHANNEL_TYPES.filter((t) => set.has(t)) as string[];
    return [...known, ...[...set].filter((t) => !known.includes(t))];
  }, [services]);

  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
  useEffect(() => {
    if (typeFilter !== ALL_TYPES && !availableTypes.includes(typeFilter)) {
      setTypeFilter(ALL_TYPES);
    }
  }, [availableTypes, typeFilter]);

  const dayParam = searchParams.get('day');
  const selectedDay = useMemo(() => {
    const offset = dayParam !== null ? Number(dayParam) : 0;
    return Number.isFinite(offset) && offset >= 0 && offset < DAY_TABS ? dayStart(offset) : dayStart(0);
  }, [dayParam]);

  const setDay = useCallback(
    (offset: number) => {
      const next = new URLSearchParams(searchParams);
      next.set('day', String(offset));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const onProgramClick = useCallback(
    (program: Program) => navigate(`/epg/programs/${encodeURIComponent(String(program.id))}`),
    [navigate]
  );

  // ---- Weekly view (single service, 8 columns by day) --------------------
  if (globalServiceId !== undefined) {
    if (services === null) {
      return <EmptyState title="ロード中" loading />;
    }
    if (!selectedService) {
      return <EmptyState title="サービスが見つかりません" description={`ID: ${globalServiceId}`} />;
    }
    const columns: EpgColumn[] = dayTabs.map((tab, i) => ({
      key: `d${i}`,
      service: selectedService,
      dayStartMs: tab.day,
      label: tab.isToday ? '今日' : undefined,
    }));
    return (
      <Stack spacing={3}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button size="small" onClick={() => navigate('/epg')}>
            ← 番組表
          </Button>
          <SectionHeader>{selectedService.name} の番組表 (8日間)</SectionHeader>
        </Stack>
        {programsError && <Alert severity="error">番組情報を取得できません: {programsError}</Alert>}
        {programs === null ? (
          programsError ? null : (
            <EmptyState title="ロード中" loading />
          )
        ) : (
          <EpgTable columns={columns} programs={programs} onProgramClick={onProgramClick} />
        )}
      </Stack>
    );
  }

  // ---- Day grid (all services, one day) ---------------------------------
  const filteredServices = (services ?? []).filter(
    (s) => typeFilter === ALL_TYPES || s.channel?.type === typeFilter
  );

  const columns: EpgColumn[] = filteredServices.map((service: Service) => ({
    key: String(service.id),
    service,
    dayStartMs: selectedDay,
  }));

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <SectionHeader>EPG 番組表</SectionHeader>
      </Stack>

      <Tabs
        value={dayParam !== null ? Number(dayParam) : 0}
        onChange={(_, v: number) => setDay(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {dayTabs.map((tab, i) => (
          <Tab key={i} label={tab.label} sx={{ minWidth: 90 }} />
        ))}
      </Tabs>

      <TypeFilter types={availableTypes} value={typeFilter} onChange={setTypeFilter} />

      {servicesError && <Alert severity="error">サービス一覧を取得できません: {servicesError}</Alert>}
      {programsError && <Alert severity="error">番組情報を取得できません: {programsError}</Alert>}

      {services === null || programs === null ? (
        programsError || servicesError ? null : (
          <EmptyState title="ロード中" loading />
        )
      ) : (
        <EpgTable columns={columns} programs={programs} onProgramClick={onProgramClick} />
      )}

      {programs !== null && filteredServices.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          該当するサービスがありません。
        </Typography>
      )}
    </Stack>
  );
}
