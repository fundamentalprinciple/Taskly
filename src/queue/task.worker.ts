import "../temporal-init.js";
import { Worker } from "bullmq";
import { redisConnection } from "./connection.js";
import { updateTaskStatus } from "../modules/tasks/task.service.js";
import { processTask } from "./task.processor.js";
import { recordTaskAttempt } from "./task.audit.js";

export const taskWorker = new Worker(
  "task-processing",
  async (job) => {
    const { taskId, userId } = job.data;
    const attemptNumber = job.attemptsMade + 1;
    const isFinalAttempt = attemptNumber >= (job.opts.attempts ?? 1);

    await recordTaskAttempt(taskId, attemptNumber);

    try {
      await updateTaskStatus(taskId, userId, "RUNNING");

      const result = await processTask(taskId);
      await updateTaskStatus(taskId, userId, "COMPLETED");
      return result;
    } catch (error) {
      if (isFinalAttempt) {
        await updateTaskStatus(taskId, userId, "FAILED");
      }
      throw error;
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
