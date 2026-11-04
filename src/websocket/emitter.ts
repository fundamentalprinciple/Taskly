import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./events.js";

type TasklySocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function emitToUser(
  io: TasklySocketServer,
  userId: string,
  event: "taskStatusUpdated",
  payload: Parameters<ServerToClientEvents["taskStatusUpdated"]>[0],
) {
  io.to(`user:${userId}`).emit(event, payload);
}
