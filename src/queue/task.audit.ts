import { db } from "../prisma/db.js";
import { Temporal } from "temporal-polyfill";

export async function recordTaskAttempt(
  taskId: string,
  attemptNumber: number,
  executionDuration?: number,
) {
  return db.orm.public.JobAuditLog.create({
    taskId,
    attemptNumber,
    executionTime: Temporal.Now.instant(),
    executionDuration,
  });
}
