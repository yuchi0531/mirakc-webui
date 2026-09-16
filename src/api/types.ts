/** Types mirroring the Mirakurun-compatible mirakc Web API. Fields not guaranteed
 *  by mirakc are optional and must be checked before rendering. */

export interface Version {
  current: string;
  latest: string;
}

export interface Channel {
  type: string;
  channel: string;
}

export interface Service {
  /** ServiceItem id: mirakc extension, string | number. Always String(id) for URLs. */
  id: string | number;
  serviceId: number;
  networkId: number;
  name: string;
  /** 1 = TV. Only type === 1 is shown. */
  type: number;
  channel: Channel;
  remoteControlKeyId?: number;
  /** EPG fields are NOT guaranteed; render indicator only when present. */
  epgReady?: boolean;
  epgUpdated?: boolean;
}

export interface TunerUser {
  id: string;
  agent?: string | null;
  priority: number;
}

export interface Tuner {
  index: number;
  name: string;
  types: string[];
  command: string;
  pid?: number | null;
  isAvailable?: boolean;
  isFree?: boolean;
  isRemote?: boolean;
  isUsing?: boolean;
  isFault?: boolean;
  user?: TunerUser | null;
  users?: TunerUser[];
}

/** Program fields used by the WebUI; extra fields are preserved via the index
 *  signature. Mirrors GET /api/programs (Mirakurun-compatible). */
export interface Program {
  id: string | number;
  serviceId: number;
  startAt: number;
  duration: number;
  name?: string;
  [key: string]: unknown;
}

export type SseStatus = 'connecting' | 'open' | 'error';

export interface SseEvent {
  /** Monotonic local id for React keys. */
  seq: number;
  type: string;
  data: unknown;
  receivedAt: number;
}
