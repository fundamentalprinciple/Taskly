import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { createTaskController } from "./controllers/task.controller.js";
import { getTaskController } from "./controllers/task.controller.js";
import { updateTaskController } from "./controllers/task.controller.js";
import { deleteTaskController } from "./controllers/task.controller.js";
import { updateTaskStatusController } from "./controllers/task.controller.js";

const router = Router();

router.post("/tasks", authenticate, createTaskController);
router.get("/tasks/:id", authenticate, getTaskController);
router.patch("/tasks/:id", authenticate, updateTaskController);
router.delete("/tasks/:id", authenticate, deleteTaskController);
router.patch("/tasks/:id/status", authenticate, updateTaskStatusController);

export default router;
