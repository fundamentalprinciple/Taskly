import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  createTaskController,
  getTaskController,
  updateTaskController,
  deleteTaskController,
  updateTaskStatusController,
  exportTasksController,
  getTasksController,
  getDashboardController,
} from "./controllers/task.controller.js";

const router = Router();

router.post("/tasks", authenticate, createTaskController);
router.get("/tasks", authenticate, getTasksController);
router.get("/dashboard", authenticate, getDashboardController);
router.post("/tasks/export", authenticate, exportTasksController);
router.get("/tasks/:id", authenticate, getTaskController);
router.patch("/tasks/:id", authenticate, updateTaskController);
router.delete("/tasks/:id", authenticate, deleteTaskController);
router.patch("/tasks/:id/status", authenticate, updateTaskStatusController);

export default router;
