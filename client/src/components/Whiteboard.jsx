import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import UserCursors from './UserCursors';
import { useSocket } from '../context/SocketContext';
import { getOrCreateUserId } from '../utils/userId'; // ✅ Add this import

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const ConnectionStatus = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  background-color: ${props => props.connected ? '#2ecc71' : '#e74c3c'};
  color: white;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const Whiteboard = ({ roomId, onUserCountUpdate }) => {
  const { socket, connected } = useSocket();
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [cursors, setCursors] = useState({});
  const [drawingData, setDrawingData] = useState([]);

  const userId = getOrCreateUserId(); // ✅ Create or get persistent userId

  useEffect(() => {
    if (socket && roomId && connected) {
      // ✅ Send both roomId and userId
      socket.emit('join-room', { roomId, userId });

      socket.on('room-joined', (data) => {
        console.log('Joined room:', data);
        onUserCountUpdate(data.activeUsers);

        if (data.drawingData && data.drawingData.length > 0) {
          console.log(`Received ${data.drawingData.length} drawing commands from server`);
          setDrawingData(data.drawingData);
        } else {
          console.log('No drawing data received from server');
          setDrawingData([]);
        }
      });

      socket.on('user-joined', (data) => {
        console.log('User joined:', data);
        onUserCountUpdate(data.activeUsers);
      });

      socket.on('user-left', (data) => {
        console.log('User left:', data);
        onUserCountUpdate(data.activeUsers);
        setCursors(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
      });

      socket.on('cursor-update', (data) => {
        setCursors(prev => ({
          ...prev,
          [data.userId]: { x: data.x, y: data.y }
        }));
      });

      return () => {
        socket.off('room-joined');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('cursor-update');
        socket.emit('leave-room');
      };
    }
  }, [socket, roomId, connected, onUserCountUpdate, userId]); // ✅ userId added to deps

  const handleColorChange = (color) => setDrawingColor(color);
  const handleStrokeWidthChange = (width) => setStrokeWidth(width);
  const handleClearCanvas = () => socket?.emit('clear-canvas');
  const handleCursorMove = (x, y) => socket?.emit('cursor-move', { x, y });

  return (
    <Container>
      <Toolbar
        color={drawingColor}
        strokeWidth={strokeWidth}
        onColorChange={handleColorChange}
        onStrokeWidthChange={handleStrokeWidthChange}
        onClearCanvas={handleClearCanvas}
      />
      <CanvasContainer>
        <DrawingCanvas
          color={drawingColor}
          strokeWidth={strokeWidth}
          socket={socket}
          roomId={roomId}
          initialDrawingData={drawingData}
          onCursorMove={handleCursorMove}
        />
        <UserCursors cursors={cursors} />
        <ConnectionStatus connected={connected}>
          {connected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>
      </CanvasContainer>
    </Container>
  );
};

export default Whiteboard;
