import { useEffect, useRef } from 'react';

/** Run `callback` immediately and then on a fixed interval.
 *  Skips ticks while the document is hidden (avoids pointless API load). */
export function usePolling(callback: () => void, intervalMs: number): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current();
    const timer = window.setInterval(() => {
      if (!document.hidden) savedCallback.current();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
}
