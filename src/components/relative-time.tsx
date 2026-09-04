import { formatDistanceToNowStrict } from "date-fns";

/**
 * Renders as a <time> with a machine-readable datetime, so the relative label
 * stays accessible and the exact timestamp is available on hover.
 */
export function RelativeTime({ date }: { date: Date | string }) {
  const value = typeof date === "string" ? new Date(date) : date;

  return (
    <time dateTime={value.toISOString()} title={value.toLocaleString()}>
      {formatDistanceToNowStrict(value, { addSuffix: true })}
    </time>
  );
}
