import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";

export interface TaskJobPayload {
  taskId: string;
  userId: string;
}

export const taskQueue = new Queue<TaskJobPayload>("task-processing", {
  connection: redisConnection,
});
