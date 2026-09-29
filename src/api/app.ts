import express from "express";
import { errorHandler } from "./error.middleware.js";
import cookieParser from "cookie-parser";
import v1Router from "./v1/index.js";
import { requestLogger } from "../middleware/request-logger.js";
import { requestId } from "../middleware/request-id.js";

const app = express();

app.use(requestId);
app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use("/api/v1", v1Router);
app.use(errorHandler);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
