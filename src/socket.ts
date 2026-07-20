import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(token?: string): Socket {
  const authToken = token || localStorage.getItem("token") || "";
  if (!socketInstance) {
    socketInstance = io({
      autoConnect: true,
      reconnection: true,
      auth: { token: authToken },
    });
  } else if (authToken) {
    (socketInstance.auth as any) = { token: authToken };
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function useSocketEvent<T = any>(eventName: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const eventListener = (data: T) => {
      if (handlerRef.current) {
        handlerRef.current(data);
      }
    };

    socket.on(eventName, eventListener);

    return () => {
      socket.off(eventName, eventListener);
    };
  }, [eventName]);
}
