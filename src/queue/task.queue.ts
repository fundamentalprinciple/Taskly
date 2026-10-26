import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";

export interface TaskJobPayload {
  taskId: string;
  userId: string;
}

export interface ExportJobPayload extends TaskJobPayload {
  format: "csv";
  filters?: Record<string, string | number | boolean>;
}

export const taskQueue = new Queue<TaskJobPayload>("task-processing", {
  connection: redisConnection,
});

export const exportQueue = new Queue<ExportJobPayload>("task-export", {
  connection: redisConnection,
});

export interface DeadLetterPayload extends TaskJobPayload {
  originalJobId?: string;
  failureReason: string;
  stacktrace?: string;
  attemptsMade: number;
  failedAt: string;
}

export const deadLetterQueue = new Queue<DeadLetterPayload>(
  "task-processing-dlq",
  { connection: redisConnection },
);
