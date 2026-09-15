import { useEffect, useRef, useState } from 'react';
import type { SseEvent, SseStatus } from '../api/types';

const MAX_EVENTS = 200;

const KNOWN_EVENTS = [
  'tuner.status-changed',
  'epg.programs-updated',
  'onair.program-changed',
  'recording.started',
  'recording.stopped',
  'recording.failed',
  'recording.rescheduled',
  'recording.record-saved',
  'recording.record-removed',
  'recording.content-removed',
  'recording.record-broken',
  'timeshift.timeline',
  'timeshift.started',
  'timeshift.stopped',
  'timeshift.record-started',
  'timeshift.record-updated',
  'timeshift.record-ended',
];

export interface UseSseResult {
  status: SseStatus;
  events: SseEvent[];
  /** Set when the last connection attempt errored; cleared on open. */
  error: string | null;
}

/** EventSource subscriber for mirakc's `GET /events` (SSE, same-origin).
 *  mirakc replays initial-state events on every (re)connect, so the list is
 *  reset on each `open`. Auto-reconnect is native to EventSource. */
export function useSse(): UseSseResult {
  const [status, setStatus] = useState<SseStatus>('connecting');
  const [events, setEvents] = useState<SseEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    let source: EventSource | null = null;

    const handle = (type: string) => (ev: MessageEvent<string>) => {
      let data: unknown = ev.data;
      try {
        data = JSON.parse(ev.data);
      } catch {
        /* keep raw text */
      }
      seqRef.current += 1;
      const entry: SseEvent = { seq: seqRef.current, type, data, receivedAt: Date.now() };
      setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS));
    };

    const open = () => {
      source = new EventSource('/events');
      source.onopen = () => {
        // Reset: the server replays initial state on every connect.
        seqRef.current = 0;
        setEvents([]);
        setError(null);
        setStatus('open');
      };
      source.onerror = () => {
        setError('イベントストリームへの接続が切断されました。再接続を試行しています。');
        setStatus('error');
      };
      for (const type of KNOWN_EVENTS) source.addEventListener(type, handle(type));
      // Catch any event type not in the known list.
      source.onmessage = handle('message');
    };

    open();

    return () => {
      source?.close();
    };
  }, []);

  return { status, events, error };
}
