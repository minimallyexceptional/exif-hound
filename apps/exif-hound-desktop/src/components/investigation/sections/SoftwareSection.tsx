import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { SoftwareInsights } from 'exif-insights';
import InsightCard from '../InsightCard';
import InsightList, { InsightListEntry } from '../InsightList';

interface SoftwareSectionProps {
  software: SoftwareInsights;
  onOpenSoftwareAnalysis: () => void;
}

/**
 * Software and processing summary: detected editing software and the
 * edited-vs-camera-original split.
 */
export const SoftwareSection: React.FC<SoftwareSectionProps> = ({ software, onOpenSoftwareAnalysis }) => {
  const entries: InsightListEntry[] = software.detected.map(item => ({
    key: item.name,
    label: item.name,
    count: item.count
  }));

  return (
    <InsightCard
      icon={<SlidersHorizontal className="w-4 h-4" />}
      title="Software Processing"
      count={software.editedCount > 0 ? `${software.editedCount} edited` : 'none'}
      drillInLabel="Details"
      onDrillIn={onOpenSoftwareAnalysis}
      emptyMessage={software.detected.length === 0 ? 'No editing-software traces found in this dataset' : undefined}
    >
      <div className="flex flex-col gap-3">
        <InsightList entries={entries} />
        <p className="text-xs text-app-accent-dim tabular-nums selectable-value">
          {software.editedCount} edited · {software.cameraOriginalCount} appear camera-original
        </p>
      </div>
    </InsightCard>
  );
};

export default SoftwareSection;
