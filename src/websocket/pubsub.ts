import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";
import { redisConnection } from "../queue/connection.js";

export const TASK_EVENTS_CHANNEL = "taskly:events";

export interface TaskStatusEvent {
  type: "task.status.updated";
  userId: string;
  payload: {
    taskId: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    updatedAt: string;
  };
}

const publisher = new Redis(redisConnection as RedisOptions);

export async function publishTaskStatus(event: TaskStatusEvent) {
  await publisher.publish(TASK_EVENTS_CHANNEL, JSON.stringify(event));
}
