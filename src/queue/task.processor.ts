export interface TaskExecutionResult {
  taskId: string;
  durationMs: number;
}

export async function processTask(
  taskId: string,
): Promise<TaskExecutionResult> {
  const startedAt = Date.now();

  // Placeholder for workload-specific processing.
  console.log(`Starting background processing for task ${taskId}`);

  const durationMs = Date.now() - startedAt;

  console.log(`Finished task ${taskId} in ${durationMs}ms`);

  return { taskId, durationMs };
}
