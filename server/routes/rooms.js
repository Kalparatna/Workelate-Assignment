const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

/**
 * @route   POST /api/rooms/join
 * @desc    Join or create a room
 * @access  Public
 */
router.post('/join', async (req, res) => {
  try {
    const { roomId } = req.body;
    
    // Validate room ID
    if (!roomId || typeof roomId !== 'string' || roomId.length < 6 || roomId.length > 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID must be 6-8 alphanumeric characters' 
      });
    }
    
    // Check if room ID is alphanumeric
    if (!/^[a-zA-Z0-9]+$/.test(roomId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID must contain only letters and numbers' 
      });
    }
    
    // Find or create the room
    const room = await Room.findOrCreateRoom(roomId);
    
    // Update last activity
    room.lastActivity = Date.now();
    await room.save();
    
    res.status(200).json({
      success: true,
      roomId: room.roomId,
      createdAt: room.createdAt,
      isNewRoom: room.drawingData.length === 0
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while joining room' 
    });
  }
});

/**
 * @route   GET /api/rooms/:roomId
 * @desc    Get room information
 * @access  Public
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find the room
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Return room info (without full drawing data to keep response size small)
    res.status(200).json({
      success: true,
      roomId: room.roomId,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      drawingCommandCount: room.drawingData.length
    });
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while getting room info' 
    });
  }
});

module.exports = router;