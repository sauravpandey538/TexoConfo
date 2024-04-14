const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// Define the user schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  bioData: { type: String },
  avatar: {
    type: String, // cloudinary url
  },
  coverImage: {
    type: String, // cloudinary url
  },
  status: {type: String,},
  // post:[postSchema],
  refreshToken: { type: String },
}, { timestamps: true });


//  hashing
userSchema.pre("save",async function(next){
  if(!this.isModified("password"))return next();
  this.password = await bcrypt.hash(this.password,10)
  next();
})
// debuging
userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password,this.password)
}
// tokens
userSchema.methods.generateAccessToken = function(){
  return jwt.sign({
    _id: this._id,
  },
  "Kalo@#Access",
  {
    expiresIn:"2d"
  }
  )
}

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign({
    _id: this._id,
  },
  "Kalo@#Refresh",
  {
    expiresIn:"2d"
  }
  )
}


// Create the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
