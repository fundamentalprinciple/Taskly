import "../temporal-init.js";
import { Worker } from "bullmq";
import { redisConnection } from "./connection.js";
import { updateTaskStatus } from "../modules/tasks/task.service.js";

export const taskWorker = new Worker(
  "task-processing",
  async (job) => {
    const { taskId, userId } = job.data;

    await updateTaskStatus(taskId, userId, "RUNNING");

    try {
      // Placeholder for actual background processing.
      console.log(`Processing task ${taskId}`);
      await updateTaskStatus(taskId, userId, "COMPLETED");
    } catch (error) {
      await updateTaskStatus(taskId, userId, "FAILED");
      throw error;
    }
  },
  { connection: redisConnection },
);

taskWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

taskWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});
