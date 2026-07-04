const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const thousands = new Intl.NumberFormat('de-DE');

/** "67" -> "67'". */
export function formatMinute(minute: number): string {
  return `${minute}'`;
}

/** (2, 1) -> "2 - 1". */
export function formatScore(home: number, away: number): string {
  return `${home} - ${away}`;
}

/** 12400 -> "12.4K". */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** 28105820 -> "28.105.820". */
export function formatThousands(value: number): string {
  return thousands.format(value);
}

/** 50 -> "+50", -10 -> "-10". */
export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}

/** "7xKXtg2C…sgAsU" -> "7xKX…gAsU" — truncated wallet address for display. */
export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Short age label: "30s", "2m", "1h". */
export function formatRelativeTime(fromTs: number, nowTs: number): string {
  const seconds = Math.max(0, Math.round((nowTs - fromTs) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}
