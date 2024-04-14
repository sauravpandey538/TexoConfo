const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  author:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
