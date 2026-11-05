import { createServer } from "node:http";
import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";
import { redisConnection } from "../queue/connection.js";
import { TASK_EVENTS_CHANNEL, type TaskStatusEvent } from "./pubsub.js";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import { verifyAccessToken } from "../modules/auth/token.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./events.js";

const PORT = Number(process.env.WS_PORT) || 3001;
const subscriber = new Redis(redisConnection as RedisOptions);

subscriber.subscribe(TASK_EVENTS_CHANNEL, (error, count) => {
  if (error) {
    console.error("Redis subscription failed:", error);
    return;
  }

  console.log(`Subscribed to ${TASK_EVENTS_CHANNEL} (${count} channel)`);
});

subscriber.on("message", (channel, message) => {
  if (channel !== TASK_EVENTS_CHANNEL) return;

  try {
    const event = JSON.parse(message) as TaskStatusEvent;

    if (
      event.type !== "task.status.updated" ||
      typeof event.userId !== "string" ||
      typeof event.payload?.taskId !== "string" ||
      !["PENDING", "RUNNING", "COMPLETED", "FAILED"].includes(
        event.payload.status,
      ) ||
      typeof event.payload.updatedAt !== "string"
    ) {
      console.warn("Ignored invalid task event.");
      return;
    }

    io.to(`user:${event.userId}`).emit("taskStatusUpdated", event.payload);
  } catch (error) {
    console.error("Failed to process Redis event:", error);
  }
});

const httpServer = createServer();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

io.use((socket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (typeof token !== "string" || !token) {
    next(new Error("Authentication required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    socket.data.userId = payload.sub;
    socket.data.role = payload.role;

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const userRoom = `user:${socket.data.userId}`;

  socket.join(userRoom);

  socket.emit("connected", {
    userId: socket.data.userId,
    socketId: socket.id,
  });

  console.log(`WebSocket connected: ${socket.id} (${userRoom})`);

  socket.on("disconnect", (reason) => {
    console.log(`WebSocket disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Taskly WebSocket server listening on port ${PORT}`);
});

export { io };
