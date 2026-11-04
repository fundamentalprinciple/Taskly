export interface ServerToClientEvents {
  connected: (payload: { userId: string; socketId: string }) => void;
  disconnected: (payload: { reason: string }) => void;
  taskStatusUpdated: (payload: {
    taskId: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    updatedAt: string;
  }) => void;
}

export interface ClientToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  role: "ADMIN" | "MEMBER";
}
