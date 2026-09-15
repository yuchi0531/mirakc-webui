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
  isFree?: boolean;
  user?: TunerUser | null;
  users?: TunerUser[];
}

export type SseStatus = 'connecting' | 'open' | 'error';

export interface SseEvent {
  /** Monotonic local id for React keys. */
  seq: number;
  type: string;
  data: unknown;
  receivedAt: number;
}

export interface ApiError {
  message: string;
}
