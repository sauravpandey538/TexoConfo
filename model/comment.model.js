const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post', // Reference to the User model
    // required: true
  },

  // trying. may be error
  commentor:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
  },
  comment:{
    type:String,
  },
createdAt: {
    type: Date,
    default: Date.now
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
