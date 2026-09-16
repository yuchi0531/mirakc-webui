import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import { getService, getServices, getTuners, getVersion, isTunerBusy } from './api/client';
import type { Service, SseEvent, Tuner, Version } from './api/types';
import { useSse } from './hooks/useSse';
import { usePolling } from './hooks/usePolling';
import { Header } from './components/Header';
import { StatusTab } from './components/StatusTab';
import { ChannelListTab } from './components/ChannelListTab';
import { EventsTab } from './components/EventsTab';
import { GuideTab } from './components/GuideTab';

const SERVICES_POLL_MS = 60_000;

interface TabPanelProps {
  value: number;
  index: number;
  children: ReactNode;
}

function TabPanel({ value, index, children }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

/** Extract the ServiceId from an epg.programs-updated payload. */
function sseServiceId(data: unknown): string | number | null {
  if (!data || typeof data !== 'object') return null;
  const value = (data as { serviceId?: unknown }).serviceId;
  return typeof value === 'number' || typeof value === 'string' ? value : null;
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [version, setVersion] = useState<Version | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [tuners, setTuners] = useState<Tuner[] | null>(null);
  const [tunersError, setTunersError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const { status: sseStatus, events: sseEvents, error: sseError } = useSse();

  // Initial version fetch.
  useEffect(() => {
    const controller = new AbortController();
    getVersion(controller.signal)
      .then((v) => {
        setVersion(v);
        setVersionError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setVersionError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
  }, []);

  // Monotonic sequence ignores out-of-order responses; the controller is
  // aborted on unmount so no state is set after teardown.
  const tunerSeqRef = useRef(0);
  const tunerAbortRef = useRef<AbortController | null>(null);

  const loadTuners = useCallback(() => {
    const seq = ++tunerSeqRef.current;
    tunerAbortRef.current?.abort();
    const controller = new AbortController();
    tunerAbortRef.current = controller;
    getTuners(controller.signal)
      .then((list) => {
        if (seq !== tunerSeqRef.current) return;
        setTuners(Array.isArray(list) ? list : []);
        setTunersError(null);
      })
      .catch((err: unknown) => {
        if (seq !== tunerSeqRef.current || controller.signal.aborted) return;
        setTunersError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  // Fetch tuners initially.
  useEffect(() => {
    loadTuners();
    return () => {
      tunerSeqRef.current += 1;
      tunerAbortRef.current?.abort();
    };
  }, [loadTuners]);

  // Refetch on tuner.status-changed (no periodic polling needed).
  // Compare by object identity: seq resets on every reconnect (initial replay).
  const lastTunerEventRef = useRef<SseEvent | null>(null);
  useEffect(() => {
    const newest = sseEvents[0];
    if (!newest || newest === lastTunerEventRef.current) return;
    lastTunerEventRef.current = newest;
    if (newest.type === 'tuner.status-changed') loadTuners();
  }, [sseEvents, loadTuners]);

  // Services share the same seq-guard/abort pattern as tuners (moved from StatusTab).
  const servicesSeqRef = useRef(0);
  const servicesAbortRef = useRef<AbortController | null>(null);

  const loadServices = useCallback(() => {
    const seq = ++servicesSeqRef.current;
    servicesAbortRef.current?.abort();
    const controller = new AbortController();
    servicesAbortRef.current = controller;
    getServices(controller.signal)
      .then((list) => {
        if (seq !== servicesSeqRef.current) return;
        setServices(Array.isArray(list) ? list : []);
        setServicesError(null);
      })
      .catch((err: unknown) => {
        if (seq !== servicesSeqRef.current || controller.signal.aborted) return;
        setServicesError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  // Per-service refresh merges one updated service into the list. Controllers
  // are keyed by service id: duplicate events coalesce, but refreshes for other
  // services are not cancelled (a reconnect replays one event per service).
  const serviceRefreshAbortsRef = useRef(new Map<string, AbortController>());

  const refreshService = useCallback((serviceId: string | number) => {
    const key = String(serviceId);
    const pending = serviceRefreshAbortsRef.current;
    pending.get(key)?.abort();
    const controller = new AbortController();
    pending.set(key, controller);
    getService(serviceId, controller.signal)
      .then((service) => {
        if (controller.signal.aborted) return;
        setServices((prev) => {
          if (!prev) return prev;
          const index = prev.findIndex((s) => String(s.id) === key);
          if (index === -1) return prev;
          const next = prev.slice();
          next[index] = service;
          return next;
        });
      })
      .catch(() => {
        /* ignore: the 60s poll resyncs the full list */
      })
      .finally(() => {
        if (pending.get(key) === controller) pending.delete(key);
      });
  }, []);

  // Initial fetch + periodic refresh (skipped while hidden).
  usePolling(loadServices, SERVICES_POLL_MS);

  useEffect(
    () => () => {
      servicesSeqRef.current += 1;
      servicesAbortRef.current?.abort();
      for (const controller of serviceRefreshAbortsRef.current.values()) controller.abort();
      serviceRefreshAbortsRef.current.clear();
    },
    []
  );

  // Merge the updated service on epg.programs-updated.
  const lastServiceEventRef = useRef<SseEvent | null>(null);
  useEffect(() => {
    const newest = sseEvents[0];
    if (!newest || newest === lastServiceEventRef.current) return;
    lastServiceEventRef.current = newest;
    if (newest.type !== 'epg.programs-updated') return;
    const serviceId = sseServiceId(newest.data);
    if (serviceId !== null) refreshService(serviceId);
  }, [sseEvents, refreshService]);

  const activeTuners = (tuners ?? []).filter(isTunerBusy).length;

  return (
    <>
      <Header
        sseStatus={sseStatus}
        activeTuners={activeTuners}
        version={version?.current ?? null}
        versionError={versionError}
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Tabs value={tab} onChange={(_, value: number) => setTab(value)} variant="scrollable">
            <Tab label="ステータス" />
            <Tab label="チャンネル一覧" />
            <Tab label="イベント" />
            <Tab label="接続ガイド" />
          </Tabs>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <TabPanel value={tab} index={0}>
          <StatusTab
            version={version}
            tuners={tuners}
            tunersError={tunersError}
            services={services}
            servicesError={servicesError}
            sseStatus={sseStatus}
          />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <ChannelListTab services={services} servicesError={servicesError} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <EventsTab events={sseEvents} error={sseError} />
        </TabPanel>
        <TabPanel value={tab} index={3}>
          <GuideTab />
        </TabPanel>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4 }}>
          mirakc WebUI — 静的 SPA (mirakc の server.mounts で配信)
        </Typography>
      </Container>
    </>
  );
}
