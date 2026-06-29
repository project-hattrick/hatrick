import { io, type Socket } from 'socket.io-client';
import { env } from '@/lib/env';

let socket: Socket | null = null;

/** Singleton socket.io client to the backend realtime gateway. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.wsUrl, { autoConnect: true, transports: ['websocket'] });
  }
  return socket;
}
