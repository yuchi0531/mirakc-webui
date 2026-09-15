import type { Service, Tuner, TunerUser, Version } from './types';

/** All paths are origin-root absolute so they work under any mount path
 *  (e.g. mirakc server.mounts at /www) and through the dev proxy. */
async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  } catch {
    throw new Error(`${path} への接続に失敗しました`);
  }
  if (!response.ok) {
    let detail = '';
    try {
      const text = await response.text();
      if (text) detail = `: ${text.slice(0, 200)}`;
    } catch {
      /* ignore body read errors */
    }
    throw new Error(`${path} が HTTP ${response.status} を返しました${detail}`);
  }
  return (await response.json()) as T;
}

export function getVersion(signal?: AbortSignal): Promise<Version> {
  return getJson<Version>('/api/version', signal);
}

export function getServices(signal?: AbortSignal): Promise<Service[]> {
  return getJson<Service[]>('/api/services', signal);
}

export function getTuners(signal?: AbortSignal): Promise<Tuner[]> {
  return getJson<Tuner[]>('/api/tuners', signal);
}

export function logoUrl(id: string | number): string {
  return `/api/services/${encodeURIComponent(String(id))}/logo`;
}

/** Normalize one tuner entry from the API (user/users may both be present). */
export function tunerUsers(tuner: Tuner): TunerUser[] {
  const list: TunerUser[] = [];
  if (Array.isArray(tuner.users)) list.push(...tuner.users);
  if (tuner.user) list.push(tuner.user);
  const seen = new Set<string>();
  return list.filter((u) => {
    const key = `${u.id}:${u.priority}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
