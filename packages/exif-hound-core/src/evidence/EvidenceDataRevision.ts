export type EvidenceDataRevisionListener = () => void;

/** Notifies Evidence hub consumers when project evidence sources change (e.g. workflow writes). */
export class EvidenceDataRevision {
  private revision = 0;
  private listeners = new Set<EvidenceDataRevisionListener>();

  bump(): void {
    this.revision += 1;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // A broken subscriber must not break writers.
      }
    }
  }

  getRevision(): number {
    return this.revision;
  }

  subscribe(listener: EvidenceDataRevisionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Test helper — resets revision counter and listeners. */
  resetForTests(): void {
    this.revision = 0;
    this.listeners.clear();
  }
}

export const projectEvidenceRevision = new EvidenceDataRevision();
