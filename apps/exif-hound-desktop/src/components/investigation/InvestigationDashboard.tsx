import React from 'react';
import { Images } from 'lucide-react';
import type { AnalysisTool } from './AnalysisTool';
import type { InvestigationInsights } from 'exif-insights';
import OverviewSection from './sections/OverviewSection';
import LocationsSection from './sections/LocationsSection';
import DevicesSection from './sections/DevicesSection';
import TimelineSection from './sections/TimelineSection';
import SoftwareSection from './sections/SoftwareSection';
import AnomaliesSection from './sections/AnomaliesSection';

interface InvestigationDashboardProps {
  images: { id: string }[];
  insights: InvestigationInsights;
  onOpenTool: (tool: AnalysisTool) => void;
}

/**
 * The Investigations landing view: a dataset-insights dashboard composed
 * of reusable section cards, each with drill-in access to the dedicated
 * analysis tools.
 */
export const InvestigationDashboard: React.FC<InvestigationDashboardProps> = ({
  images,
  insights,
  onOpenTool
}) => {
  return (
    <div className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-app-white">Investigation Dashboard</h2>
            <p className="text-app-accent-dim text-sm leading-relaxed mt-1.5">
              Insights compiled from your images' metadata
            </p>
          </div>
          <div className="flex items-center gap-2 border border-app-gray-light/60 bg-app-gray px-3 py-2 rounded-lg shrink-0">
            <Images className="w-4 h-4 text-app-accent" />
            <span className="text-sm font-medium text-app-white tabular-nums selectable-value">
              {images.length} image{images.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="glass-panel p-8 sm:p-12 rounded-lg text-center">
            <Images className="w-10 h-10 text-app-accent-dim mx-auto mb-3" />
            <h3 className="text-base font-medium text-app-white mb-1">No images loaded</h3>
            <p className="text-sm text-app-accent-dim max-w-md mx-auto leading-relaxed">
              Upload images to begin your investigation. The dashboard compiles
              locations, devices, timelines, software traces and anomalies from
              each image's metadata automatically.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <OverviewSection insights={insights} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <LocationsSection
                locations={insights.locations}
                onOpenGeolocation={() => onOpenTool('geolocation')}
              />
              <DevicesSection
                devices={insights.devices}
                onOpenPatternAnalysis={() => onOpenTool('pattern')}
              />
              <SoftwareSection
                software={insights.software}
                onOpenSoftwareAnalysis={() => onOpenTool('software')}
              />
              <TimelineSection
                timeline={insights.timeline}
                onOpenTimeline={() => onOpenTool('timeline')}
                className="lg:col-span-2"
              />
              <AnomaliesSection
                anomalies={insights.anomalies}
                totalCount={images.length}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationDashboard;
