import { InsightImage, InvestigationInsights } from '../types';
import { BaseAnalyzer } from './BaseAnalyzer';
import { AnomalyAnalyzer } from './analyzers/AnomalyAnalyzer';
import { DeviceAnalyzer } from './analyzers/DeviceAnalyzer';
import { LocationAnalyzer } from './analyzers/LocationAnalyzer';
import { OverviewAnalyzer } from './analyzers/OverviewAnalyzer';
import { SoftwareAnalyzer } from './analyzers/SoftwareAnalyzer';
import { TimelineAnalyzer } from './analyzers/TimelineAnalyzer';

interface AnalyzerSet {
  overview: BaseAnalyzer<InvestigationInsights['overview']>;
  locations: BaseAnalyzer<InvestigationInsights['locations']>;
  devices: BaseAnalyzer<InvestigationInsights['devices']>;
  timeline: BaseAnalyzer<InvestigationInsights['timeline']>;
  software: BaseAnalyzer<InvestigationInsights['software']>;
  anomalies: BaseAnalyzer<InvestigationInsights['anomalies']>;
}

/**
 * Facade for the full insights pipeline. Computes every dashboard section
 * from a normalized dataset in a single pass per analyzer.
 */
export class InsightsEngine {
  private readonly analyzers: AnalyzerSet;

  constructor(analyzers: AnalyzerSet = {
    overview: new OverviewAnalyzer(),
    locations: new LocationAnalyzer(),
    devices: new DeviceAnalyzer(),
    timeline: new TimelineAnalyzer(),
    software: new SoftwareAnalyzer(),
    anomalies: new AnomalyAnalyzer()
  }) {
    this.analyzers = analyzers;
  }

  /**
   * Compute the complete insights snapshot for a dataset. Re-invoking with
   * a changed dataset recomputes all sections (callers are expected to
   * memoize per dataset version).
   */
  compute(images: readonly InsightImage[]): InvestigationInsights {
    return {
      overview: this.analyzers.overview.analyze(images),
      locations: this.analyzers.locations.analyze(images),
      devices: this.analyzers.devices.analyze(images),
      timeline: this.analyzers.timeline.analyze(images),
      software: this.analyzers.software.analyze(images),
      anomalies: this.analyzers.anomalies.analyze(images)
    };
  }
}
