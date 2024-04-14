const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  caption: {
    type: String,
     default:null 
 },
  imageURL: {
    type: String,
     default:null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment' // Reference to the Comment collection
    }
  ]

});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
