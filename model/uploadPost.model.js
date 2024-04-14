const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Define the user schema
const userPostSchema = new Schema({
 
  caption: {
    type: String, // caption for a post
  },
  image: {
    type: String,
    default:null // image to be used in caption
  },

}, { timestamps: true });


const userPost = mongoose.model("userPost", userPostSchema);

module.exports = userPost;



// this is not working for now
