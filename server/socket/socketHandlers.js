const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

// Map to track active users in each room
const activeRooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    let currentRoomId = null;
    let userId = null;

    // Handle user joining a room
    socket.on('join-room', async ({ roomId, userId: clientUserId }) => {
      try {
        // ✅ Use the client-provided userId or fallback
        userId = clientUserId || uuidv4();
        socket.userId = userId;
    
        
        // Leave previous room if any
        if (currentRoomId) {
          socket.leave(currentRoomId);
          removeUserFromRoom(currentRoomId, userId);
        }
        
        // Join new room
        currentRoomId = roomId;
        socket.join(roomId);
        
        // Add user to active room
        addUserToRoom(roomId, userId);
        
        // Get or create room in database
        const room = await Room.findOrCreateRoom(roomId);
        
        // Send room data to the client
        socket.emit('room-joined', {
          roomId,
          userId,
          activeUsers: getActiveUsersCount(roomId),
          drawingData: room.drawingData || []
        });
        
        console.log(`Sent ${room.drawingData ? room.drawingData.length : 0} drawing commands to user ${userId}`);
        
        // Notify other users in the room
        socket.to(roomId).emit('user-joined', {
          userId,
          activeUsers: getActiveUsersCount(roomId)
        });
        
        console.log(`User ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room via socket:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle cursor movement
    socket.on('cursor-move', ({ x, y }) => {
      if (!currentRoomId || !userId) return;
      
      // Broadcast cursor position to other users in the room
      socket.to(currentRoomId).emit('cursor-update', {
        userId,
        x,
        y
      });
    });

    // Handle start of drawing
    socket.on('draw-start', async ({ x, y, color, width }) => {
      if (!currentRoomId || !userId) return;
      
      const drawData = { x, y, color, width, userId };
      
      // Save current color and width for use in draw-move
      socket.currentColor = color;
      socket.currentWidth = width;
      socket.pointCounter = 0;
      
      // Broadcast to other users in the room
      socket.to(currentRoomId).emit('draw-start-broadcast', drawData);
      
      try {
        // Store in database
        const room = await Room.findOne({ roomId: currentRoomId });
        if (room) {
          await room.addDrawingCommand('stroke', {
            points: [{ x, y }],
            color,
            width,
            userId,
            completed: false // Mark as incomplete stroke
          });
        }
      } catch (error) {
        console.error('Error storing draw-start:', error);
      }
    });

    // Handle drawing movement
    socket.on('draw-move', async ({ x, y }) => {
      if (!currentRoomId || !userId) return;
      
      // Broadcast to other users in the room
      socket.to(currentRoomId).emit('draw-move-broadcast', {
        userId,
        x,
        y,
        color: socket.currentColor,
        width: socket.currentWidth
      });
      
      try {
        // Store key points in the database to ensure drawing persistence
        // We'll store every 5th point to balance between accuracy and database load
        if (socket.pointCounter === undefined) socket.pointCounter = 0;
        socket.pointCounter++;
        
        if (socket.pointCounter % 5 === 0) {
          const room = await Room.findOne({ roomId: currentRoomId });
          if (room) {
            // Add this point to the current stroke
            const lastStrokeIndex = room.drawingData.findIndex(cmd => 
              cmd.type === 'stroke' && cmd.data && cmd.data.userId === userId && !cmd.data.completed
            );
            
            if (lastStrokeIndex !== -1) {
              // Add point to existing stroke
              room.drawingData[lastStrokeIndex].data.points.push({ x, y });
              room.markModified('drawingData');
              await room.save();
            }
          }
        }
      } catch (error) {
        console.error('Error storing draw-move:', error);
      }
    });

    // Handle end of drawing
    socket.on('draw-end', async () => {
      if (!currentRoomId || !userId) return;
      
      // Broadcast to other users in the room
      socket.to(currentRoomId).emit('draw-end-broadcast', { userId });
      
      try {
        // Mark the stroke as completed in the database
        const room = await Room.findOne({ roomId: currentRoomId });
        if (room) {
          // Find the last stroke for this user and mark it as completed
          const lastStrokeIndex = room.drawingData.findIndex(cmd => 
            cmd.type === 'stroke' && cmd.data && cmd.data.userId === userId && !cmd.data.completed
          );
          
          if (lastStrokeIndex !== -1) {
            room.drawingData[lastStrokeIndex].data.completed = true;
            room.markModified('drawingData');
            await room.save();
          }
        }
      } catch (error) {
        console.error('Error updating draw-end:', error);
      }
    });

    // Handle canvas clear
    socket.on('clear-canvas', async () => {
      if (!currentRoomId || !userId) return;
      
      // Broadcast to other users in the room
      socket.to(currentRoomId).emit('canvas-clear', { userId });
      
      try {
        // Clear drawing data in database
        const room = await Room.findOne({ roomId: currentRoomId });
        if (room) {
          await room.clearDrawingCommands();
        }
      } catch (error) {
        console.error('Error clearing canvas:', error);
      }
    });

    // Handle user leaving
    socket.on('leave-room', () => {
      handleUserLeaving();
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      handleUserLeaving();
    });

    // Helper function to handle user leaving
    const handleUserLeaving = () => {
      if (currentRoomId && userId) {
        socket.leave(currentRoomId);
        removeUserFromRoom(currentRoomId, userId);
        
        // Notify other users in the room
        io.to(currentRoomId).emit('user-left', {
          userId,
          activeUsers: getActiveUsersCount(currentRoomId)
        });
        
        console.log(`User ${userId} left room ${currentRoomId}`);
        
        currentRoomId = null;
        userId = null;
      }
    };
  });

  // Helper functions for room management
  function addUserToRoom(roomId, userId) {
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    activeRooms.get(roomId).add(userId);
  }

  function removeUserFromRoom(roomId, userId) {
    if (activeRooms.has(roomId)) {
      activeRooms.get(roomId).delete(userId);
      
      // Clean up empty rooms
      if (activeRooms.get(roomId).size === 0) {
        activeRooms.delete(roomId);
      }
    }
  }

  function getActiveUsersCount(roomId) {
    return activeRooms.has(roomId) ? activeRooms.get(roomId).size : 0;
  }

  // Set up periodic cleanup of old rooms (every 6 hours)
  setInterval(async () => {
    try {
      const result = await Room.cleanupOldRooms();
      console.log(`Cleaned up ${result.deletedCount} inactive rooms`);
    } catch (error) {
      console.error('Error during room cleanup:', error);
    }
  }, 6 * 60 * 60 * 1000);
};