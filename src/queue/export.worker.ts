async function updateTaskStatusAndPublish(
  taskId: string,
  userId: string,
  status: "RUNNING" | "COMPLETED" | "FAILED",
) {
  const task = await updateTaskStatus(taskId, userId, status);

  if (!task) return;

  try {
    await publishTaskStatus({
      type: "task.status.updated",
      userId,
      payload: {
        taskId,
        status,
        updatedAt: task.updatedAt.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to publish task status event:", error);
  }
}

import "../temporal-init.js";
import { Worker } from "bullmq";
import { redisConnection } from "./connection.js";
import { publishTaskStatus } from "../websocket/pubsub.js";
import { processExport } from "./export.processor.js";
import {
  getTaskById,
  updateTaskPayload,
  updateTaskStatus,
} from "../modules/tasks/task.service.js";
import { recordTaskAttempt } from "./task.audit.js";

export const exportWorker = new Worker(
  "task-export",
  async (job) => {
    const { taskId, userId, filters } = job.data;
    const startedAt = Date.now();
    const attemptNumber = job.attemptsMade + 1;
    let exportFilePath: string | undefined;
    let exportRowCount: number | undefined;

    try {
      await updateTaskStatusAndPublish(taskId, userId, "RUNNING");

      const result = await processExport(taskId, userId, filters);
      exportFilePath = result.filePath;
      exportRowCount = result.rowCount;

      const task = await getTaskById(taskId, userId);
      if (task) {
        await updateTaskPayload(taskId, userId, {
          ...(task.payload as Record<string, string | number | boolean | null>),
          exportMetadata: {
            filePath: result.filePath,
            rowCount: result.rowCount,
          },
        });
      }

      await updateTaskStatusAndPublish(taskId, userId, "COMPLETED");

      return result;
    } catch (error) {
      const isFinalAttempt = attemptNumber >= (job.opts.attempts ?? 1);

      if (isFinalAttempt) {
        await updateTaskStatusAndPublish(taskId, userId, "FAILED");
      }

      throw error;
    } finally {
      await recordTaskAttempt(
        taskId,
        attemptNumber,
        Date.now() - startedAt,
        exportFilePath,
        exportRowCount,
      );
    }
  },
  { connection: redisConnection },
);

exportWorker.on("completed", (job, result) => {
  console.log(`Export job ${job.id} completed:`, result);
});

exportWorker.on("failed", (job, error) => {
  console.error(`Export job ${job?.id} failed:`, error);
});
