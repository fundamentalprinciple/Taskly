import { db } from "../../prisma/db.js";
import { Temporal } from "temporal-polyfill";

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export async function createTask(
  userId: string,
  payload: { [key: string]: JsonValue },
) {
  return db.orm.public.Task.create({
    userId,
    status: "PENDING",
    payload,
  });
}

export async function getTaskById(taskId: string, userId: string) {
  return db.orm.public.Task.first({
    id: taskId,
    userId,
  });
}

export async function updateTask(
  taskId: string,
  userId: string,
  payload: { [key: string]: JsonValue },
) {
  const task = await getTaskById(taskId, userId);

  if (!task) {
    return null;
  }

  return db.orm.public.Task.where({
    id: taskId,
    userId,
  }).update({
    payload,
    updatedAt: Temporal.Now.instant(),
  });
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await getTaskById(taskId, userId);

  if (!task) {
    return null;
  }

  await db.orm.public.Task.where({
    id: taskId,
    userId,
  }).delete();

  return task;
}

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["RUNNING"],
  RUNNING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

export function canTransition(current: TaskStatus, next: TaskStatus) {
  return allowedTransitions[current]?.includes(next) ?? false;
}

type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export class InvalidTaskTransitionError extends Error {
  constructor(current: string, next: string) {
    super(`Invalid task status transition: ${current} -> ${next}`);
    this.name = "InvalidTaskTransitionError";
  }
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  nextStatus: TaskStatus,
) {
  const task = await getTaskById(taskId, userId);

  if (!task) {
    return null;
  }

  if (!canTransition(task.status, nextStatus)) {
    throw new InvalidTaskTransitionError(task.status, nextStatus);
  }

  return db.orm.public.Task.where({
    id: taskId,
    userId,
  }).update({
    status: nextStatus,
    updatedAt: Temporal.Now.instant(),
  });
}
