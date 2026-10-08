import React from 'react';
import { MapPin } from 'lucide-react';
import type { LocationsInsights } from 'exif-insights';
import InsightCard from '../InsightCard';
import InsightList, { InsightListEntry } from '../InsightList';
import { formatAltitudes } from '../format';

interface LocationsSectionProps {
  locations: LocationsInsights;
  onOpenGeolocation: () => void;
}

/**
 * Unique locations: reverse-geocoded place names with coordinate-cluster
 * fallback, plus images-per-location counts.
 */
export const LocationsSection: React.FC<LocationsSectionProps> = ({ locations, onOpenGeolocation }) => {
  const entries: InsightListEntry[] = locations.unique.map(location => ({
    key: location.key,
    label: location.name ?? location.coordinateLabel,
    detail: location.name ? location.coordinateLabel : undefined,
    note: formatAltitudes(location.altitudes),
    count: location.count
  }));

  return (
    <InsightCard
      icon={<MapPin className="w-4 h-4" />}
      title="Locations"
      count={`${locations.unique.length} unique`}
      drillInLabel="Geolocation"
      onDrillIn={onOpenGeolocation}
    >
      <div className="flex flex-col gap-3">
        <InsightList
          entries={entries}
          emptyMessage="No location data found in this dataset"
        />
        {locations.noGps > 0 && (
          <p className="text-xs text-app-accent-dim tabular-nums selectable-value">
            {locations.noGps} image{locations.noGps === 1 ? '' : 's'} without GPS data
          </p>
        )}
      </div>
    </InsightCard>
  );
};

export default LocationsSection;
