import { db } from "../../prisma/db.js";
import { Temporal } from "temporal-polyfill";
import {
  getOrSetCache,
  deleteCacheKeys,
  deleteCachePattern,
} from "../../cache/cache.js";

type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

const CACHE_TTL = 60;
const PAGE_SIZE_MAX = 100;

async function invalidateTaskCache(userId: string) {
  await deleteCacheKeys(
    `tasks:${userId}:list:all`,
    `tasks:${userId}:list:PENDING`,
    `tasks:${userId}:list:RUNNING`,
    `tasks:${userId}:list:COMPLETED`,
    `tasks:${userId}:list:FAILED`,
    `tasks:${userId}:dashboard`,
  );
  await deleteCachePattern(`tasks:${userId}:project:*`);
}

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export async function createTask(
  userId: string,
  payload: { [key: string]: JsonValue },
) {
  const task = await db.orm.public.Task.create({
    userId,
    status: "PENDING",
    payload,
  });

  await invalidateTaskCache(userId);
  return task;
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

  const updated = await db.orm.public.Task.where({
    id: taskId,
    userId,
  }).update({
    payload,
    updatedAt: Temporal.Now.instant(),
  });

  await invalidateTaskCache(userId);
  return updated;
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

  await invalidateTaskCache(userId);
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
  if (task.status === nextStatus) return task;
  if (!canTransition(task.status, nextStatus)) {
    throw new InvalidTaskTransitionError(task.status, nextStatus);
  }

  const updated = await db.orm.public.Task.where({
    id: taskId,
    userId,
  }).update({
    status: nextStatus,
    updatedAt: Temporal.Now.instant(),
  });

  await invalidateTaskCache(userId);
  return updated;
}

export async function getTasksForExport(
  userId: string,
  filters: Record<string, string | number | boolean> = {},
) {
  const tasks = await db.orm.public.Task.where({ userId }).all();

  return tasks.filter((task) =>
    Object.entries(filters).every(([key, value]) => {
      if (key === "status") return task.status === value;
      return true;
    }),
  );
}

export async function updateTaskPayload(
  taskId: string,
  userId: string,
  payload: { [key: string]: JsonValue },
) {
  return updateTask(taskId, userId, payload);
}

export async function getTasksForUser(userId: string, status?: TaskStatus) {
  const cacheKey = `tasks:${userId}:list:${status ?? "all"}`;

  return getOrSetCache(cacheKey, CACHE_TTL, async () => {
    const tasks = await db.orm.public.Task.where({ userId }).all();
    return status ? tasks.filter((task) => task.status === status) : tasks;
  });
}

export async function getDashboardMetadata(userId: string) {
  return getOrSetCache(`tasks:${userId}:dashboard`, CACHE_TTL, async () => {
    const tasks = await db.orm.public.Task.where({ userId }).all();

    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "PENDING").length,
      running: tasks.filter((task) => task.status === "RUNNING").length,
      completed: tasks.filter((task) => task.status === "COMPLETED").length,
      failed: tasks.filter((task) => task.status === "FAILED").length,
    };
  });
}

export async function getProjectTasksPage(
  userId: string,
  projectId: string,
  limit: number,
  cursor?: string,
) {
  const pageSize = Math.min(Math.max(limit, 1), PAGE_SIZE_MAX);
  const cacheKey = `tasks:${userId}:project:${projectId}:page:${pageSize}:${cursor ?? "first"}`;

  return getOrSetCache(cacheKey, CACHE_TTL, async () => {
    const project = await db.orm.public.Project.first({
      id: projectId,
      userId,
    });

    if (!project) return null;

    let cursorPosition: { createdAt: Temporal.Instant; id: string } | undefined;

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, "base64url").toString("utf8"),
        ) as { createdAt?: string; id?: string };

        const createdAt = Temporal.Instant.from(decoded.createdAt ?? "");

        if (
          typeof decoded.id !== "string" ||
          !decoded.id ||
          typeof decoded.createdAt !== "string" ||
          !decoded.createdAt
        ) {
          throw new Error("Invalid cursor");
        }

        cursorPosition = { createdAt, id: decoded.id };
      } catch {
        throw new Error("Invalid cursor");
      }
    }

    let query = db.orm.public.Task.where({ userId, projectId }).orderBy([
      (task) => task.createdAt.desc(),
      (task) => task.id.desc(),
    ]);

    if (cursorPosition) {
      query = query.cursor(cursorPosition);
    }

    const rows = await query.limit(pageSize + 1).all();
    const hasMore = rows.length > pageSize;
    const tasks = rows.slice(0, pageSize);
    const lastTask = tasks[tasks.length - 1];

    const nextCursor =
      hasMore && lastTask
        ? Buffer.from(
            JSON.stringify({
              createdAt: lastTask.createdAt,
              id: lastTask.id,
            }),
          ).toString("base64url")
        : null;

    return { tasks, nextCursor, hasMore };
  });
}
