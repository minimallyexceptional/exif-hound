import React from 'react';

interface CoverageMeterProps {
  label: string;
  count: number;
  total: number;
}

/**
 * Labeled horizontal meter showing how many images carry a given kind of
 * metadata. Pure tokens, so it inverts with the theme.
 */
export const CoverageMeter: React.FC<CoverageMeterProps> = ({ label, count, total }) => {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="flex flex-col gap-1" data-testid={`coverage-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-app-accent-dim">{label}</span>
        <span className="text-xs text-app-white tabular-nums selectable-value">
          {count}/{total} · {percent}%
        </span>
      </div>
      <div
        className="h-1 rounded-full bg-app-gray-light overflow-hidden"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${label}: ${count} of ${total} (${percent}%)`}
      >
        <div
          className="h-full rounded-full bg-app-white"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default CoverageMeter;
