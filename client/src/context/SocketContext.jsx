import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create context
const SocketContext = createContext(null);

// Custom hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const socketInstance = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: false, // Delay until server is confirmed
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Try connecting only after ping
    fetch(SERVER_URL)
      .then(() => {
        socketInstance.connect();
      })
      .catch((err) => {
        console.error('🚫 Server not reachable:', err);
      });

    // Event handlers
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('⚠️ Socket disconnected');
      setConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('❌ Socket connection error:', error);
      setConnected(false);
    };

    // Register events
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    // Save socket
    setSocket(socketInstance);

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up socket');
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
