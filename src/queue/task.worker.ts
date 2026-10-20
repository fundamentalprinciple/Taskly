import "../temporal-init.js";
import { Worker } from "bullmq";
import { redisConnection } from "./connection.js";
import { updateTaskStatus } from "../modules/tasks/task.service.js";
import { processTask } from "./task.processor.js";
import { recordTaskAttempt } from "./task.audit.js";
import { deadLetterQueue } from "./task.queue.js";

export const taskWorker = new Worker(
  "task-processing",
  async (job) => {
    const { taskId, userId } = job.data;
    const attemptNumber = job.attemptsMade + 1;
    const isFinalAttempt = attemptNumber >= (job.opts.attempts ?? 1);
    const jobStartedAt = Date.now();

    try {
      await updateTaskStatus(taskId, userId, "RUNNING");

      const result = await processTask(taskId);
      await updateTaskStatus(taskId, userId, "COMPLETED");
      return result;
    } catch (error) {
      if (isFinalAttempt) {
        await updateTaskStatus(taskId, userId, "FAILED");
        await deadLetterQueue.add("failed-task", {
          ...job.data,
          originalJobId: job.id,
          failureReason: error instanceof Error ? error.message : String(error),
          stacktrace: error instanceof Error ? error.stack : undefined,
          attemptsMade: attemptNumber,
          failedAt: new Date().toISOString(),
        });
      }
      throw error;
    } finally {
      await recordTaskAttempt(taskId, attemptNumber, Date.now() - jobStartedAt);
    }
  },
  { connection: redisConnection },
);

taskWorker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

taskWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});
