import React from 'react';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1.5rem;
`;

const Label = styled.span`
  font-size: 0.9rem;
  margin-right: 0.5rem;
  color: #333;
`;

const ColorButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid ${props => props.selected ? '#333' : 'transparent'};
  background-color: ${props => props.color};
  margin: 0 0.25rem;
  cursor: pointer;
  transition: transform 0.1s;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:focus {
    outline: none;
  }
`;

const StrokeWidthSlider = styled.input`
  width: 100px;
  margin: 0 0.5rem;
`;

const ClearButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-left: auto;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const StrokePreview = styled.div`
  width: 30px;
  height: ${props => props.width}px;
  background-color: ${props => props.color};
  border-radius: 4px;
  margin-left: 0.5rem;
`;

const Toolbar = ({ color, strokeWidth, onColorChange, onStrokeWidthChange, onClearCanvas }) => {
  // Available colors
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#e74c3c' },
    { name: 'Blue', value: '#3498db' },
    { name: 'Green', value: '#2ecc71' }
  ];
  
  return (
    <ToolbarContainer>
      <ToolGroup>
        <Label>Color:</Label>
        {colors.map(c => (
          <ColorButton
            key={c.value}
            color={c.value}
            selected={color === c.value}
            onClick={() => onColorChange(c.value)}
            title={c.name}
          />
        ))}
      </ToolGroup>
      
      <ToolGroup>
        <Label>Stroke Width:</Label>
        <StrokeWidthSlider
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
        />
        <StrokePreview width={strokeWidth} color={color} />
      </ToolGroup>
      
      <ClearButton onClick={onClearCanvas}>
        Clear Canvas
      </ClearButton>
    </ToolbarContainer>
  );
};

export default Toolbar;