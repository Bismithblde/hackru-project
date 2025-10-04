import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let current = { roomId: null as string | null, userId: null as string | null, username: null as string | null };

export function connect(url = undefined) {
  if (!socket) {
    socket = io(url || (import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000'));
  }
  return socket;
}

export function join(roomId: string, userId: string, username: string) {
  connect();
  current = { roomId, userId, username };
  socket!.emit('join', { roomId, userId, username });
}

export function leave() {
  if (!socket || !current.roomId || !current.userId) return;
  socket.emit('leave', { roomId: current.roomId, userId: current.userId });
  current = { roomId: null, userId: null, username: null };
}

export function on<E extends string>(event: E, cb: (...args: any[]) => void) {
  connect();
  socket!.on(event, cb as any);
}

export function off<E extends string>(event: E, cb?: (...args: any[]) => void) {
  if (!socket) return;
  if (cb) socket.off(event, cb as any);
  else socket.off(event as any);
}

export function emit(event: string, payload: any) {
  connect();
  socket!.emit(event, payload);
}

export function getSocket() {
  return socket;
}
