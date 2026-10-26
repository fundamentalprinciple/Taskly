import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTasksForExport } from "../modules/tasks/task.service.js";

export async function processExport(
  taskId: string,
  userId: string,
  filters: Record<string, string | number | boolean> = {},
) {
  const startedAt = Date.now();
  const tasks = await getTasksForExport(userId, filters);

  const outputDirectory = path.resolve("exports");
  await mkdir(outputDirectory, { recursive: true });

  const filePath = path.join(outputDirectory, `${taskId}.csv`);
  const columns = ["id", "status", "payload", "createdAt", "updatedAt"];

  const escapeCsv = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = [
    columns,
    ...tasks.map((task) => [
      task.id,
      task.status,
      JSON.stringify(task.payload),
      task.createdAt,
      task.updatedAt,
    ]),
  ];

  await writeFile(
    filePath,
    rows.map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n",
    "utf8",
  );

  return {
    taskId,
    filePath,
    rowCount: tasks.length,
    durationMs: Date.now() - startedAt,
  };
}
