import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";

export interface TaskJobPayload {
  taskId: string;
  userId: string;
}

export const taskQueue = new Queue<TaskJobPayload>("task-processing", {
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
