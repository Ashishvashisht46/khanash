import { logger } from "../../core/logger/logger";

type JobHandler = (jobId: string) => Promise<void>;

export class AiJobQueue {
  private readonly pending: string[] = [];
  private processing = false;

  constructor(private readonly handler: JobHandler) {}

  public enqueue(jobId: string): void {
    this.pending.push(jobId);
    this.processSoon();
  }

  private processSoon(): void {
    setImmediate(() => {
      void this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processing) {
      return;
    }

    const nextJobId = this.pending.shift();

    if (!nextJobId) {
      return;
    }

    this.processing = true;

    try {
      await this.handler(nextJobId);
    } catch (error) {
      logger.error("AI job execution failed", {
        jobId: nextJobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      this.processing = false;

      if (this.pending.length > 0) {
        this.processSoon();
      }
    }
  }
}
