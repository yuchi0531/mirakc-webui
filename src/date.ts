import { DateTime } from 'luxon';

export const TIME_ZONE = 'Asia/Tokyo';

/** Day start (JST, epoch ms) for a date offset from today (0 = today). */
export function dayStart(offset: number): number {
  return DateTime.now().setZone(TIME_ZONE).startOf('day').plus({ days: offset }).toMillis();
}

/** Format a JST timestamp as `M/d (weekday)`. */
export function formatDayTab(ts: number): string {
  const dt = DateTime.fromMillis(ts).setZone(TIME_ZONE);
  const week = ['日', '月', '火', '水', '木', '金', '土'][dt.weekday % 7];
  return `${dt.month}/${dt.day} (${week})`;
}

/** Format a JST timestamp as `HH:mm`. */
export function formatTime(ts: number, withSeconds = false): string {
  const dt = DateTime.fromMillis(ts).setZone(TIME_ZONE);
  return dt.toFormat(withSeconds ? 'HH:mm:ss' : 'HH:mm');
}

/** Format a JST timestamp as `YYYY/MM/DD HH:mm`. */
export function formatDateTime(ts: number): string {
  return DateTime.fromMillis(ts).setZone(TIME_ZONE).toFormat('yyyy/MM/dd HH:mm');
}

/** Format a JST timestamp as `M/d HH:mm`. */
export function formatShortDateTime(ts: number): string {
  return DateTime.fromMillis(ts).setZone(TIME_ZONE).toFormat('M/d HH:mm');
}

/** Duration in ms formatted as `H時間M分` (or `M分`). */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}時間${minutes}分`;
  if (hours > 0) return `${hours}時間`;
  return `${minutes}分`;
}
