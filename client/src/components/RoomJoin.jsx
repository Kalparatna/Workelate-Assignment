import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const Logo = styled.img`
  width: 100px;
  height: 100px;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 600px;
`;

const JoinForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 0.75rem;
  font-size: 1.1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.2s;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  
  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  font-size: 1.1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const InfoText = styled.p`
  margin-top: 1.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
  text-align: center;
`;

const generateRandomRoomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const length = 6;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

const RoomJoin = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate room ID
    if (!roomId) {
      setError('Please enter a room code');
      return;
    }
    
    if (!/^[A-Za-z0-9]{6,8}$/.test(roomId)) {
      setError('Room code must be 6-8 alphanumeric characters');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Join or create room via API
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/rooms/join`, {

        roomId: roomId.toUpperCase()
      });
      
      if (response.data.success) {
        onJoinRoom(response.data.roomId);
      } else {
        setError(response.data.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(
        error.response?.data?.message ||
        'Failed to connect to server. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateRandomRoom = () => {
    const randomRoomId = generateRandomRoomId();
    setRoomId(randomRoomId);
  };
  
  return (
    <Container>
      <Logo src="/logo.svg" alt="Collaborative Whiteboard" />
      <Title>Collaborative Whiteboard</Title>
      <Subtitle>
        Join an existing whiteboard room or create a new one by entering a room code
      </Subtitle>
      
      <JoinForm onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="roomId">Room Code</Label>
          <Input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Enter 6-8 character code"
            maxLength={8}
            autoFocus
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputGroup>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Joining...' : 'Join Room'}
        </Button>
        
        <InfoText>
          Don't have a room code?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); handleCreateRandomRoom(); }}>
            Generate a random one
          </a>
        </InfoText>
      </JoinForm>
    </Container>
  );
};

export default RoomJoin;