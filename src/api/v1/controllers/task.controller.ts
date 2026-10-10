import type { Request, Response } from "express";
import { createTask } from "../../../modules/tasks/task.service.js";
import type { AuthenticatedRequest } from "../../../middleware/auth.js";
import { getTaskById } from "../../../modules/tasks/task.service.js";
import { updateTask } from "../../../modules/tasks/task.service.js";
import { deleteTask } from "../../../modules/tasks/task.service.js";
import { updateTaskStatus } from "../../../modules/tasks/task.service.js";
import { InvalidTaskTransitionError } from "../../../modules/tasks/task.service.js";

export async function createTaskController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).user.sub;
  const task = await createTask(userId, req.body);

  res.status(201).json({
    success: true,
    data: task,
  });
}

export async function getTaskController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).user.sub;

  const taskId = req.params.id;

  if (typeof taskId !== "string") {
    res.status(400).json({
      error: "Invalid task ID",
    });
    return;
  }

  const task = await getTaskById(taskId, userId);

  if (!task) {
    res.status(404).json({
      error: "Task not found",
    });
    return;
  }

  res.json({
    success: true,
    data: task,
  });
}

export async function updateTaskController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).user.sub;
  const taskId = req.params.id;

  if (typeof taskId !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const task = await updateTask(taskId, userId, req.body);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({
    success: true,
    data: task,
  });
}

export async function deleteTaskController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).user.sub;
  const taskId = req.params.id;

  if (typeof taskId !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const task = await deleteTask(taskId, userId);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.status(204).send();
}

export async function updateTaskStatusController(req: Request, res: Response) {
  const userId = (req as AuthenticatedRequest).user.sub;
  const taskId = req.params.id;

  if (typeof taskId !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const { status } = req.body;

  if (!["PENDING", "RUNNING", "COMPLETED", "FAILED"].includes(status)) {
    res.status(400).json({ error: "Invalid task status" });
    return;
  }

  try {
    const task = await updateTaskStatus(taskId, userId, status);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    if (error instanceof InvalidTaskTransitionError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
}
