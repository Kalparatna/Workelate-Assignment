import React from 'react';
import styled from 'styled-components';

const CursorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

const Cursor = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  transform: translate(-10px, -10px);
  transition: left 0.05s ease, top 0.05s ease;
  z-index: 100;
`;

const CursorIcon = styled.svg`
  width: 100%;
  height: 100%;
`;

const CursorLabel = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  background-color: ${props => props.color};
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0.8;
`;

// Generate a consistent color based on user ID
const getUserColor = (userId) => {
  // Simple hash function to convert userId to a number
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Convert to HSL color (using hue only, with fixed saturation and lightness)
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const UserCursors = ({ cursors }) => {
  return (
    <CursorContainer>
      {Object.entries(cursors).map(([userId, position]) => {
        const color = getUserColor(userId);
        const shortId = userId.substring(0, 4);
        
        return (
          <Cursor
            key={userId}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`
            }}
          >
            <CursorIcon viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 3L19 12L12 13L9 20L5 3Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </CursorIcon>
            <CursorLabel color={color}>{shortId}</CursorLabel>
          </Cursor>
        );
      })}
    </CursorContainer>
  );
};

export default UserCursors;