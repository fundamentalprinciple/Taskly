import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = randomUUID();

  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-ID", id);

  next();
}
