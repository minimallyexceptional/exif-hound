import type { ProjectStore } from 'investigation-archive';
import type { ImageData } from '../../types';
import { EvidenceIndexBuilder } from './EvidenceIndexBuilder';
import { EvidenceRepository } from './EvidenceRepository';
import type { EvidenceIndex } from './evidenceTypes';

/** Orchestrates evidence loading and navigation helpers for the Evidence hub UI. */
export class EvidenceHubService {
  private readonly indexBuilder = new EvidenceIndexBuilder();

  constructor(
    private readonly store: ProjectStore,
    private readonly images: ImageData[],
  ) {}

  async loadIndex(): Promise<EvidenceIndex> {
    const sources = await EvidenceRepository.load(this.store);
    return this.indexBuilder.build(
      sources.ocr,
      sources.identifiers,
      sources.provenance,
      this.images,
    );
  }

  resolveImage(imageId: number): ImageData | undefined {
    return this.images.find(
      (item) => item.projectImageId === imageId && !('hasImage' in item),
    );
  }

  static totalItemCount(index: EvidenceIndex): number {
    return index.categories.reduce((sum, category) => sum + category.count, 0);
  }

  static loadErrorMessage(cause: unknown): string {
    return cause instanceof Error ? cause.message : 'Could not load evidence.';
  }
}
