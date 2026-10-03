import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getPrograms,
  getService,
  getServices,
  getTuners,
  getVersion,
  isTunerBusy,
} from '../api/client';
import type { Program, Service, SseEvent, Tuner, Version } from '../api/types';
import { useSse } from '../hooks/useSse';
import { usePolling } from '../hooks/usePolling';

export type StatusIconKey = 'normal' | 'offline' | 'active';

const SERVICES_POLL_MS = 60_000;
const PROGRAMS_REFRESH_DEBOUNCE_MS = 1500;

interface AppStateValue {
  version: Version | null;
  versionError: string | null;
  /** SSE connection is open. */
  connected: boolean;
  statusIconKey: StatusIconKey;
  services: Service[] | null;
  servicesError: string | null;
  tuners: Tuner[] | null;
  tunersError: string | null;
  programs: Program[] | null;
  programsError: string | null;
  /** Fetch the full program list once (idempotent). */
  loadPrograms: () => void;
  events: SseEvent[];
  sseError: string | null;
  activeTuners: number;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used within <AppStateProvider>');
  return value;
}

/** Extract the ServiceId from an epg.programs-updated payload. */
function sseServiceId(data: unknown): string | number | null {
  if (!data || typeof data !== 'object') return null;
  const value = (data as { serviceId?: unknown }).serviceId;
  return typeof value === 'number' || typeof value === 'string' ? value : null;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<Version | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [tuners, setTuners] = useState<Tuner[] | null>(null);
  const [tunersError, setTunersError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [programsError, setProgramsError] = useState<string | null>(null);
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

  // ---- Tuners -----------------------------------------------------------
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

  useEffect(() => {
    loadTuners();
    return () => {
      tunerSeqRef.current += 1;
      tunerAbortRef.current?.abort();
    };
  }, [loadTuners]);

  // ---- Services ---------------------------------------------------------
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

  // Per-service refresh merges one updated service into the list.
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

  // ---- Programs (lazy, shared by EPG and search) ------------------------
  const programsSeqRef = useRef(0);
  const programsAbortRef = useRef<AbortController | null>(null);
  // Refs make `loadPrograms` stable so consumers can call it from an effect
  // without re-triggering a fetch on every state change.
  const programsRequestedRef = useRef(false);
  const programsLoadedRef = useRef(false);

  const loadPrograms = useCallback(() => {
    programsRequestedRef.current = true;
    const seq = ++programsSeqRef.current;
    programsAbortRef.current?.abort();
    const controller = new AbortController();
    programsAbortRef.current = controller;
    getPrograms(controller.signal)
      .then((list) => {
        if (seq !== programsSeqRef.current) return;
        setPrograms(Array.isArray(list) ? list : []);
        setProgramsError(null);
        programsLoadedRef.current = true;
      })
      .catch((err: unknown) => {
        if (seq !== programsSeqRef.current || controller.signal.aborted) return;
        setProgramsError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  // Stable idempotent entry point: fetch only on the first request.
  const ensurePrograms = useCallback(() => {
    if (programsRequestedRef.current) return;
    loadPrograms();
  }, [loadPrograms]);

  // Debounced program refresh driven by SSE (epg.programs-updated).
  const programsRefreshTimerRef = useRef<number | null>(null);
  const scheduleProgramsRefresh = useCallback(() => {
    if (!programsRequestedRef.current) return;
    if (programsRefreshTimerRef.current !== null) return;
    programsRefreshTimerRef.current = window.setTimeout(() => {
      programsRefreshTimerRef.current = null;
      loadPrograms();
    }, PROGRAMS_REFRESH_DEBOUNCE_MS);
  }, [loadPrograms]);

  useEffect(
    () => () => {
      programsSeqRef.current += 1;
      programsAbortRef.current?.abort();
      if (programsRefreshTimerRef.current !== null) window.clearTimeout(programsRefreshTimerRef.current);
    },
    []
  );

  // ---- SSE-driven updates ----------------------------------------------
  const lastEventRef = useRef<SseEvent | null>(null);
  useEffect(() => {
    const newest = sseEvents[0];
    if (!newest || newest === lastEventRef.current) return;
    lastEventRef.current = newest;
    if (newest.type === 'tuner.status-changed') {
      loadTuners();
    } else if (newest.type === 'epg.programs-updated') {
      const serviceId = sseServiceId(newest.data);
      if (serviceId !== null) refreshService(serviceId);
      scheduleProgramsRefresh();
    }
  }, [sseEvents, loadTuners, refreshService, scheduleProgramsRefresh]);

  const activeTuners = useMemo(() => (tuners ?? []).filter(isTunerBusy).length, [tuners]);
  const connected = sseStatus === 'open';

  const statusIconKey: StatusIconKey = !connected
    ? 'offline'
    : activeTuners > 0
      ? 'active'
      : 'normal';

  const value: AppStateValue = {
    version,
    versionError,
    connected,
    statusIconKey,
    services,
    servicesError,
    tuners,
    tunersError,
    programs,
    programsError,
    loadPrograms: ensurePrograms,
    events: sseEvents,
    sseError,
    activeTuners,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
