/** Types mirroring the Mirakurun-compatible mirakc Web API. Fields not guaranteed
 *  by mirakc are optional and must be checked before rendering. */

export interface Version {
  current: string;
  latest: string;
}

/** Known channel types in display order. `BS4K` is a mirakc-BS4K fork extension. */
export const KNOWN_CHANNEL_TYPES = ['GR', 'BS', 'CS', 'SKY', 'BS4K'] as const;
export type KnownChannelType = (typeof KNOWN_CHANNEL_TYPES)[number];

export interface ChannelService {
  id: string | number;
  serviceId: number;
  networkId: number;
  name: string;
}

export interface Channel {
  type: string;
  /** For BS4K this is an opaque StreamID (decimal or 0x-hex), NOT a service id. */
  channel: string;
  name?: string;
  services?: ChannelService[];
}

export interface Service {
  /** ServiceItem id: mirakc extension, string | number. Always String(id) for URLs. */
  id: string | number;
  serviceId: number;
  networkId: number;
  name: string;
  /** 1 = TV. Only type === 1 is shown as TV; other values group defensively. */
  type: number;
  channel: Channel;
  remoteControlKeyId?: number;
  /** EPG fields are NOT guaranteed; render indicator only when present. */
  epgReady?: boolean;
  epgUpdated?: boolean;
  hasLogoData?: boolean;
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

/** ISDB genre triple as serialized by mirakc's `EpgGenre`. */
export interface ProgramGenre {
  lv1: number;
  lv2: number;
  un1: number;
  un2: number;
}

export interface ProgramVideo {
  type?: string;
  resolution?: string;
  streamContent?: number;
  componentType?: number;
}

export interface ProgramAudio {
  componentType?: number;
  isMain?: boolean;
  samplingRate?: number;
  langs?: string[];
}

export interface ProgramRelatedItem {
  type?: string;
  networkId?: number;
  serviceId?: number;
  eventId?: number;
}

/** Program model from GET /api/programs (Mirakurun-compatible). */
export interface Program {
  id: string | number;
  eventId: number;
  serviceId: number;
  networkId: number;
  startAt: number;
  duration: number;
  isFree?: boolean;
  name?: string;
  description?: string;
  extended?: Record<string, string> | null;
  video?: ProgramVideo;
  audio?: ProgramAudio;
  audios?: ProgramAudio[];
  genres?: ProgramGenre[];
  series?: unknown;
  relatedItems?: ProgramRelatedItem[];
  [key: string]: unknown;
}

/** Channel types handled by the mirakc-BS4K fork as decoded-TLV passthrough. */
export const MMT_CHANNEL_TYPES = ['BS4K'] as const;

export function isMmtChannelType(type: string | undefined | null): boolean {
  return MMT_CHANNEL_TYPES.includes((type ?? '').toUpperCase() as (typeof MMT_CHANNEL_TYPES)[number]);
}

/** Default port for a split BS4K decode server, not shipped by mirakc. */
export const DEFAULT_DECODE_SERVER_ORIGIN = 'http://localhost:40773';

export type SseStatus = 'connecting' | 'open' | 'error';
export type ThemeMode = 'light' | 'dark';

export interface SseEvent {
  /** Monotonic local id for React keys. */
  seq: number;
  type: string;
  data: unknown;
  receivedAt: number;
}
