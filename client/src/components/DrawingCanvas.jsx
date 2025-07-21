import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const Canvas = styled.canvas`
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
`;

const DrawingCanvas = ({ color, strokeWidth, socket, roomId, initialDrawingData, onCursorMove }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // Initialize canvas and context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth * 2; // For higher resolution
      canvas.height = parent.clientHeight * 2;
      
      // Scale context for higher resolution
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = color;
      context.lineWidth = strokeWidth;
      contextRef.current = context;
      
      // Redraw canvas if we have drawing data
      if (initialDrawingData && initialDrawingData.length > 0) {
        console.log('Redrawing canvas after resize with initial data');
        redrawCanvas(initialDrawingData);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initialDrawingData]);
  
  // Effect to handle initialDrawingData changes
  useEffect(() => {
    if (initialDrawingData && initialDrawingData.length > 0 && contextRef.current) {
      console.log('Initial drawing data changed, redrawing canvas');
      redrawCanvas(initialDrawingData);
    }
  }, [initialDrawingData]);
  
  // Update stroke style when color or width changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [color, strokeWidth]);
  
  // Set up socket event listeners for drawing
  useEffect(() => {
    if (!socket) return;
    
    // Track other users' drawing states
    const otherUsersDrawing = new Map();
    
    // Listen for drawing events from other users
    socket.on('draw-start-broadcast', (data) => {
      const context = contextRef.current;
      if (!context) return;
      
      // Store the drawing state for this user
      otherUsersDrawing.set(data.userId, {
        color: data.color,
        width: data.width,
        lastX: data.x,
        lastY: data.y
      });
      
      context.save();
      context.strokeStyle = data.color;
      context.lineWidth = data.width;
      context.beginPath();
      context.moveTo(data.x, data.y);
      context.stroke();
      context.restore();
    });
    
    socket.on('draw-move-broadcast', (data) => {
      const context = contextRef.current;
      if (!context) return;
      
      // Get the drawing state for this user
      const userDrawing = otherUsersDrawing.get(data.userId);
      if (!userDrawing) {
        console.log(`Received draw-move without prior draw-start for user ${data.userId}`);
        // Create a new drawing state for this user if we missed the draw-start event
        otherUsersDrawing.set(data.userId, {
          color: data.color || '#000000',
          width: data.width || 3,
          lastX: data.x,
          lastY: data.y
        });
        return;
      }
      
      context.save();
      context.strokeStyle = data.color || userDrawing.color;
      context.lineWidth = data.width || userDrawing.width;
      context.beginPath();
      context.moveTo(userDrawing.lastX, userDrawing.lastY);
      context.lineTo(data.x, data.y);
      context.stroke();
      context.restore();
      
      // Update the last position
      userDrawing.lastX = data.x;
      userDrawing.lastY = data.y;
    });
    
    socket.on('draw-end-broadcast', (data) => {
      const context = contextRef.current;
      if (!context) return;
      
      context.beginPath();
      
      // Clean up the drawing state for this user
      otherUsersDrawing.delete(data.userId);
    });
    
    socket.on('canvas-clear', () => {
      clearCanvas();
    });
    
    // Listen for room-joined event to get initial drawing data
    socket.on('room-joined', (data) => {
      if (data.drawingData && data.drawingData.length > 0) {
        redrawCanvas(data.drawingData);
      }
    });
    
    return () => {
      socket.off('draw-start-broadcast');
      socket.off('draw-move-broadcast');
      socket.off('draw-end-broadcast');
      socket.off('canvas-clear');
      socket.off('room-joined');
    };
  }, [socket]);
  
  // Helper function to redraw canvas from drawing data
  const redrawCanvas = (drawingData) => {
    const context = contextRef.current;
    if (!context) return;
    
    // Clear canvas first
    clearCanvas();
    
    // Redraw each stroke
    drawingData.forEach(command => {
      if (command.type === 'clear') {
        clearCanvas();
      } else if (command.type === 'stroke' && command.data && command.data.points) {
        const { points, color, width } = command.data;
        
        if (points.length > 0) {
          context.save();
          context.strokeStyle = color || '#000000';
          context.lineWidth = width || 3;
          context.beginPath();
          context.moveTo(points[0].x, points[0].y);
          
          for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x, points[i].y);
          }
          
          context.stroke();
          context.restore();
          context.beginPath();
        }
      }
    });
    
    console.log(`Redrew canvas with ${drawingData.length} drawing commands`);
  };
  
  // Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    context.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
  };
  
  // Get mouse/touch position relative to canvas
  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top)
    };
  };
  
  // Start drawing
  const startDrawing = (event) => {
    const { x, y } = getCoordinates(event);
    const context = contextRef.current;
    if (!context) return;
    
    context.beginPath();
    context.moveTo(x, y);
    context.stroke();
    
    setIsDrawing(true);
    setLastPosition({ x, y });
    
    // Emit draw-start event
    if (socket) {
      socket.emit('draw-start', {
        x,
        y,
        color,
        width: strokeWidth
      });
    }
  };
  
  // Continue drawing
  const draw = (event) => {
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(event);
    const context = contextRef.current;
    if (!context) return;
    
    context.lineTo(x, y);
    context.stroke();
    
    setLastPosition({ x, y });
    
    // Emit draw-move event
    if (socket) {
      socket.emit('draw-move', { x, y });
    }
    
    // Track cursor position for other users
    onCursorMove(x, y);
  };
  
  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const context = contextRef.current;
    if (context) {
      context.beginPath();
    }
    
    setIsDrawing(false);
    
    // Emit draw-end event
    if (socket) {
      socket.emit('draw-end');
    }
  };
  
  // Track cursor movement even when not drawing
  const handleMouseMove = (event) => {
    const { x, y } = getCoordinates(event);
    onCursorMove(x, y);
    
    if (isDrawing) {
      draw(event);
    }
  };
  
  return (
    <Canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
};

export default DrawingCanvas;