import type { Service } from './types';

/** ISDB service_type values as emitted by the scan jobs. */
export const SERVICE_TYPE_TV = 0x01;
export const SERVICE_TYPE_RADIO = 0x02;
export const SERVICE_TYPE_DATA = 0xad;

export function isTvService(type: number | undefined): boolean {
  return Number(type) === SERVICE_TYPE_TV;
}

export type ServiceCategory = 'tv' | 'radio' | 'data' | 'other';

export function serviceCategory(service: Service): ServiceCategory {
  switch (Number(service.type)) {
    case SERVICE_TYPE_TV:
      return 'tv';
    case SERVICE_TYPE_RADIO:
      return 'radio';
    case SERVICE_TYPE_DATA:
      return 'data';
    default:
      return 'other';
  }
}
