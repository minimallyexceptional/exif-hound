import type { BatchRunJob } from './batch';

export type WorkflowRunQueueEvent =
  | { type: 'job-started'; job: BatchRunJob; index: number; total: number }
  | { type: 'job-completed'; job: BatchRunJob; index: number; total: number }
  | { type: 'job-failed'; job: BatchRunJob; index: number; total: number; error: string }
  | { type: 'queue-drained'; completed: number; total: number };

export type WorkflowRunQueueListener = (event: WorkflowRunQueueEvent) => void;

export class WorkflowRunQueue {
  private processing = false;
  private pending: BatchRunJob[] = [];
  private listeners = new Set<WorkflowRunQueueListener>();

  get isProcessing(): boolean {
    return this.processing;
  }

  subscribe(listener: WorkflowRunQueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  enqueue(jobs: BatchRunJob[]): void {
    if (this.processing) throw new Error('A batch is already running.');
    this.pending = [...jobs];
  }

  async process(processor: (job: BatchRunJob) => Promise<void>): Promise<void> {
    if (this.processing) throw new Error('A batch is already running.');
    const jobs = this.pending;
    this.pending = [];
    if (!jobs.length) return;
    this.processing = true;
    let completed = 0;
    const total = jobs.length;
    try {
      for (let index = 0; index < jobs.length; index += 1) {
        const job = jobs[index];
        this.emit({ type: 'job-started', job, index, total });
        try {
          await processor(job);
          completed += 1;
          this.emit({ type: 'job-completed', job, index, total });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.emit({ type: 'job-failed', job, index, total, error: message });
          throw error;
        }
      }
      this.emit({ type: 'queue-drained', completed, total });
    } finally {
      this.processing = false;
    }
  }

  private emit(event: WorkflowRunQueueEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
