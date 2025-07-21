const mongoose = require('mongoose');

// Drawing Command Schema (embedded in Room)
const drawingCommandSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['stroke', 'clear'],
    required: true
  },
  data: {
    type: Object,
    required: function() {
      return this.type === 'stroke';
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Room Schema
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  drawingData: [
    drawingCommandSchema
  ]
});

// Update lastActivity timestamp before saving
roomSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

// Method to add a drawing command
roomSchema.methods.addDrawingCommand = function(commandType, commandData) {
  this.drawingData.push({
    type: commandType,
    data: commandData,
    timestamp: Date.now()
  });
  this.lastActivity = Date.now();
  return this.save();
};

// Method to clear all drawing commands
roomSchema.methods.clearDrawingCommands = function() {
  this.drawingData = [];
  this.lastActivity = Date.now();
  return this.save();
};

// Static method to find or create a room
roomSchema.statics.findOrCreateRoom = async function(roomId) {
  let room = await this.findOne({ roomId });
  
  if (!room) {
    room = new this({
      roomId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      drawingData: []
    });
    await room.save();
  }
  
  return room;
};

// Static method to clean up old rooms (inactive for 24+ hours)
roomSchema.statics.cleanupOldRooms = async function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.deleteMany({ lastActivity: { $lt: oneDayAgo } });
};

module.exports = mongoose.model('Room', roomSchema);