import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join', user._id);
    });

    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('onlineUsers', setOnlineUsers);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const on = (event, callback) => socketRef.current?.on(event, callback);
  const off = (event, callback) => socketRef.current?.off(event, callback);
  const emit = (event, data) => socketRef.current?.emit(event, data);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineUsers, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
