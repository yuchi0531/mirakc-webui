import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import { getTuners, getVersion, isTunerBusy } from './api/client';
import type { SseEvent, Tuner, Version } from './api/types';
import { useSse } from './hooks/useSse';
import { Header } from './components/Header';
import { StatusTab } from './components/StatusTab';
import { EventsTab } from './components/EventsTab';
import { GuideTab } from './components/GuideTab';

interface TabPanelProps {
  value: number;
  index: number;
  children: ReactNode;
}

function TabPanel({ value, index, children }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [version, setVersion] = useState<Version | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [tuners, setTuners] = useState<Tuner[] | null>(null);
  const [tunersError, setTunersError] = useState<string | null>(null);
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
            sseEvents={sseEvents}
          />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <EventsTab events={sseEvents} error={sseError} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <GuideTab />
        </TabPanel>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4 }}>
          mirakc WebUI — 静的 SPA (mirakc の server.mounts で配信)
        </Typography>
      </Container>
    </>
  );
}
