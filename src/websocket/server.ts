import { createServer } from "node:http";
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
