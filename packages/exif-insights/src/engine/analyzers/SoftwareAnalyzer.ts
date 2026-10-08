import { BaseAnalyzer } from '../BaseAnalyzer';
import { InsightImage, SoftwareInsights } from '../../types';

/**
 * Software/processing analysis: detected editing software and the
 * edited-vs-camera-original split.
 */
export class SoftwareAnalyzer extends BaseAnalyzer<SoftwareInsights> {
  analyze(images: readonly InsightImage[]): SoftwareInsights {
    const counts = new Map<string, number>();
    let editedCount = 0;

    for (const image of images) {
      if (this.hasText(image.software)) {
        editedCount++;
        const name = (image.software as string).trim();
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }

    const detected = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => this.byCountThenName(a, b));

    return {
      detected,
      editedCount,
      cameraOriginalCount: images.length - editedCount
    };
  }
}
