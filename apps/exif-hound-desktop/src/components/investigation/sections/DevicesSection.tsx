import React from 'react';
import { Camera } from 'lucide-react';
import type { DevicesInsights } from 'exif-insights';
import InsightCard from '../InsightCard';
import InsightList, { InsightListEntry } from '../InsightList';

interface DevicesSectionProps {
  devices: DevicesInsights;
  onOpenPatternAnalysis: () => void;
}

/**
 * Unique devices: camera make+model fingerprints with lens and
 * attribution detail.
 */
export const DevicesSection: React.FC<DevicesSectionProps> = ({ devices, onOpenPatternAnalysis }) => {
  const entries: InsightListEntry[] = devices.unique.map(device => {
    const details = [
      device.lenses.length > 0 ? device.lenses.join(', ') : undefined,
      device.artists.length > 0 ? `by ${device.artists.join(', ')}` : undefined,
      device.copyrights.length > 0 ? device.copyrights.join(', ') : undefined
    ].filter(Boolean);
    return {
      key: device.key,
      label: device.label,
      detail: details.length > 0 ? details.join(' · ') : undefined,
      count: device.count
    };
  });

  return (
    <InsightCard
      icon={<Camera className="w-4 h-4" />}
      title="Devices"
      count={`${devices.unique.length} unique`}
      drillInLabel="Patterns"
      onDrillIn={onOpenPatternAnalysis}
    >
      <div className="flex flex-col gap-3">
        <InsightList
          entries={entries}
          emptyMessage="No device information found in this dataset"
        />
        {devices.unknownCount > 0 && (
          <p className="text-xs text-app-accent-dim tabular-nums selectable-value">
            {devices.unknownCount} image{devices.unknownCount === 1 ? '' : 's'} with no device metadata
          </p>
        )}
      </div>
    </InsightCard>
  );
};

export default DevicesSection;
