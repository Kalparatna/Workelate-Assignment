import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';
import { SocketProvider } from './context/SocketContext';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RoomCode = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeaveButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

function App() {
  const [roomId, setRoomId] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  
  // Check for existing room in session storage
  useEffect(() => {
    const savedRoom = sessionStorage.getItem('whiteboard-room');
    if (savedRoom) {
      setRoomId(savedRoom);
    }
  }, []);
  
  // Save room to session storage when it changes
  useEffect(() => {
    if (roomId) {
      sessionStorage.setItem('whiteboard-room', roomId);
    } else {
      sessionStorage.removeItem('whiteboard-room');
    }
  }, [roomId]);
  
  const handleJoinRoom = (newRoomId) => {
    setRoomId(newRoomId);
  };
  
  const handleLeaveRoom = () => {
    setRoomId(null);
    setActiveUsers(0);
  };
  
  const handleUserCountUpdate = (count) => {
    setActiveUsers(count);
  };
  
  return (
    <SocketProvider>
      <AppContainer>
        {roomId ? (
          <>
            <Header>
              <Title>Collaborative Whiteboard</Title>
              <RoomInfo>
                <RoomCode>
                  <span>Room:</span>
                  <strong>{roomId}</strong>
                </RoomCode>
                <UserCount>
                  <span>Users:</span>
                  <strong>{activeUsers}</strong>
                </UserCount>
                <LeaveButton onClick={handleLeaveRoom}>Leave Room</LeaveButton>
              </RoomInfo>
            </Header>
            <MainContent>
              <Whiteboard 
                roomId={roomId} 
                onUserCountUpdate={handleUserCountUpdate} 
              />
            </MainContent>
          </>
        ) : (
          <RoomJoin onJoinRoom={handleJoinRoom} />
        )}
      </AppContainer>
    </SocketProvider>
  );
}

export default App;