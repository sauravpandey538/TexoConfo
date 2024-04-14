const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: { type: String },
  receiver: { type: String },
  message: { type: String },
  roomName: { type: String },
  status: { type: String, enum: ['sent', 'seen'], default: 'sent' }, // Add status field

}, { timestamps: true }); // Adding timestamps

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;

