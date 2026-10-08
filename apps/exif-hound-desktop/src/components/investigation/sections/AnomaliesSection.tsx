import React from 'react';
import {
  AlertTriangle,
  Clock,
  FileWarning,
  MapPinOff,
  Maximize2,
  RotateCcw,
  Users
} from 'lucide-react';
import type { AnomaliesInsights } from 'exif-insights';
import InsightCard from '../InsightCard';

interface AnomaliesSectionProps {
  anomalies: AnomaliesInsights;
  totalCount: number;
}

interface AnomalyFlag {
  key: keyof AnomaliesInsights;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const FLAGS: AnomalyFlag[] = [
  {
    key: 'gpsWithoutTimestamp',
    label: 'GPS without capture time',
    description: 'Located but undated',
    icon: <MapPinOff className="w-4 h-4" />
  },
  {
    key: 'timestampWithoutGps',
    label: 'Capture time without GPS',
    description: 'Dated but unlocated',
    icon: <Clock className="w-4 h-4" />
  },
  {
    key: 'sparseMetadata',
    label: 'Sparse metadata',
    description: 'Fewer than three core EXIF fields — possibly stripped',
    icon: <FileWarning className="w-4 h-4" />
  },
  {
    key: 'multiDeviceLocations',
    label: 'Multi-device locations',
    description: 'One place, multiple cameras',
    icon: <Users className="w-4 h-4" />
  },
  {
    key: 'resolutionOutliers',
    label: 'Resolution outliers',
    description: 'Unusual image size for this dataset',
    icon: <Maximize2 className="w-4 h-4" />
  },
  {
    key: 'orientationOutliers',
    label: 'Orientation outliers',
    description: 'Differ from the dataset majority',
    icon: <RotateCcw className="w-4 h-4" />
  }
];

/**
 * Investigator flags: cross-cutting anomalies across the dataset.
 */
export const AnomaliesSection: React.FC<AnomaliesSectionProps> = ({ anomalies, totalCount }) => {
  const flagged = FLAGS.filter(flag => anomalies[flag.key].length > 0);

  return (
    <InsightCard
      icon={<AlertTriangle className="w-4 h-4" />}
      title="Anomalies"
      count={`${flagged.length} flag${flagged.length === 1 ? '' : 's'}`}
      emptyMessage={
        totalCount === 0
          ? undefined
          : flagged.length === 0
            ? 'No anomalies detected in this dataset'
            : undefined
      }
    >
      <div className="flex flex-col">
        {flagged.map(flag => (
          <div
            key={flag.key}
            className="flex items-start gap-3 py-2 border-b border-app-gray-light/30 last:border-b-0"
            title={`${anomalies[flag.key].length} image(s) flagged`}
          >
            <span className="text-app-accent-dim shrink-0 mt-0.5">{flag.icon}</span>
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="text-sm text-app-white">{flag.label}</span>
              <span className="text-xs text-app-accent-dim">{flag.description}</span>
            </div>
            <span className="shrink-0 ml-auto text-xs font-medium text-app-accent-dim bg-app-gray-light/50 rounded-full px-2 py-0.5 tabular-nums selectable-value">
              {anomalies[flag.key].length}
            </span>
          </div>
        ))}
      </div>
    </InsightCard>
  );
};

export default AnomaliesSection;
