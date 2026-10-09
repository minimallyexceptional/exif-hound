import React from 'react';

export interface InsightListEntry {
  /** Stable unique key. */
  key: string;
  /** Primary label (place name, device label, software name…). */
  label: string;
  /** Secondary detail line (coordinates, lens list…). Optional. */
  detail?: string;
  /** Right-aligned count badge. */
  count?: number;
  /** Extra text shown under the entry, e.g. altitude range. */
  note?: string;
}

interface InsightListProps {
  entries: InsightListEntry[];
  /** Maximum entries rendered before the "showing first N" note. */
  max?: number;
  emptyMessage?: string;
}

/**
 * Ranked entry list shared by the locations, devices, software and
 * anomaly sections. Values are selectable data.
 */
export const InsightList: React.FC<InsightListProps> = ({ entries, max = 8, emptyMessage }) => {
  if (entries.length === 0) {
    return emptyMessage ? (
      <p className="text-xs text-app-accent-dim leading-relaxed">{emptyMessage}</p>
    ) : null;
  }

  const visible = entries.slice(0, max);

  return (
    <div className="flex flex-col">
      {visible.map(entry => (
        <div
          key={entry.key}
          className="flex items-start justify-between gap-3 py-2.5 border-b border-app-gray-light/30 last:border-b-0"
        >
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-sm text-app-white truncate selectable-value">{entry.label}</span>
            {entry.detail && (
              <span className="text-xs text-app-accent-dim truncate selectable-value">{entry.detail}</span>
            )}
            {entry.note && (
              <span className="text-xs text-app-accent-dim tabular-nums selectable-value">{entry.note}</span>
            )}
          </div>
          {entry.count !== undefined && (
            <span className="shrink-0 text-xs font-medium text-app-accent-dim bg-app-gray-light/50 rounded-full px-2 py-0.5 tabular-nums selectable-value">
              {entry.count}
            </span>
          )}
        </div>
      ))}
      {entries.length > max && (
        <p className="text-xs text-app-accent-dim mt-2">
          Showing first {max} of {entries.length}
        </p>
      )}
    </div>
  );
};

export default InsightList;
