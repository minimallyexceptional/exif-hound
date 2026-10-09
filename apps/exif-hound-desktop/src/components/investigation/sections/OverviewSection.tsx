import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import type { InvestigationInsights } from 'exif-insights';
import InsightCard from '../InsightCard';
import InsightStat from '../InsightStat';
import CoverageMeter from '../CoverageMeter';

interface OverviewSectionProps {
  insights: InvestigationInsights;
}

/**
 * Dataset overview strip: totals plus EXIF coverage meters.
 */
export const OverviewSection: React.FC<OverviewSectionProps> = ({ insights }) => {
  const { overview } = insights;

  return (
    <InsightCard
      icon={<LayoutDashboard className="w-4 h-4" />}
      title="Dataset Overview"
      count={`${overview.total} image${overview.total === 1 ? '' : 's'}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 lg:gap-8">
        <div className="grid grid-cols-3 gap-4 min-w-0 lg:border-r lg:border-app-gray-light/40 lg:pr-8">
          <InsightStat
            label="Total images"
            value={overview.total}
            detail={overview.processing > 0 ? `${overview.processing} still processing` : undefined}
            testId="overview-total"
          />
          <InsightStat
            label="Unique locations"
            value={insights.locations.unique.length}
            testId="overview-locations"
          />
          <InsightStat
            label="Unique devices"
            value={insights.devices.unique.length}
            testId="overview-devices"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 min-w-0">
          <CoverageMeter label="GPS location" count={overview.withGps} total={overview.total} />
          <CoverageMeter label="Capture time" count={overview.withDateTime} total={overview.total} />
          <CoverageMeter label="Device info" count={overview.withDevice} total={overview.total} />
          <CoverageMeter label="Software tags" count={overview.withSoftware} total={overview.total} />
        </div>
      </div>
    </InsightCard>
  );
};

export default OverviewSection;
