import React from 'react';

interface InsightStatProps {
  label: string;
  value: string | number;
  /** Optional qualifier shown under the value, e.g. "of 24 images". */
  detail?: string;
  /** Optional test id for E2E selectors. */
  testId?: string;
}

/**
 * Compact stat readout for the overview strip. Values are selectable data
 * (repo convention) and use tabular numerals.
 */
export const InsightStat: React.FC<InsightStatProps> = ({ label, value, detail, testId }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-app-accent-dim">{label}</span>
    <span className="text-xl font-semibold text-app-white tabular-nums leading-none selectable-value" data-testid={testId}>
      {value}
    </span>
    {detail && (
      <span className="text-xs text-app-accent-dim tabular-nums">{detail}</span>
    )}
  </div>
);

export default InsightStat;
