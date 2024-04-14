const express = require("express");
const DB = require("./DB/db");
const connectDB = require("./DB/db");
const app = express();
const port = 8004;
const User = require("./model/user.model")
const Follow = require("./model/follow.model")
const Comment = require('./model/comment.model')
const Message = require('./model/message.model')
const Post = require("./model/Post.model")
const Like = require("./model/like.model")
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const upload = require("./Middleware/multer.authencation.js")
const multer = require("multer")
const uploadCloudinary = require("./utilities/cloudinary")
const verifyJWT = require("./Middleware/jwt.authencation");
const authenticateSocket = require("./Middleware/socket.authentication").authenticateSocket
const userPost = require("./model/uploadPost.model")
const mongoose = require("mongoose")

// socket.io
const http = require('http');

const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server,{
  cors :{
    origin: 'http://localhost:5173',
    credentials: true
  }
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

io.on('connection', (socket) => {
  let user1; // Define user1 variable to store the username

  console.log('A user connected');

 try {
   socket.on("set_username", async (username) => {
     try {
       user1 = username; // Store the username
       console.log("Username received from client:", user1);
 
       // Find the user in the database and update status to online
       const user = await User.findOneAndUpdate({ username: user1 }, { status: "online" }, { new: true });
       if (user) {
         console.log(`User ${user.username} status updated to online`);
       } else {
         console.log("User not found in the database for online update");
       }
     } catch (error) {
       console.error("Error updating user status to online", error);
     }
   });
   // Join room
   socket.on('join', (room) => {
     socket.join(room);
     console.log(`User joined room: ${room}`);
   });
 
   // Send message
   
   socket.on('message_read', async (messageId) => {
     try {
       // Update message status to 'seen' in the database
       const message = await Message.findByIdAndUpdate(messageId, { status: 'seen' }, { new: true });
 
       if (message) {
         console.log(`Message ${messageId} status updated to seen`);
       } else {
         console.log("Message not found in the database for status update");
       }
     } catch (error) {
       console.error("Error updating message status to seen", error);
     }
   });
   // Retrieve messages
   socket.on('get_messages', async (room) => {
     try {
       const messages = await Message.find({ roomName: room }).sort({ createdAt: -1 }).limit(20);;
       socket.emit('all_messages',messages.reverse());
     } catch (error) {
       console.error("Error retrieving messages from database", error);
     }
   });
   socket.on('chat message', async (data) => {
    const { msg, room, receiver, sender } = data;
    try {
      // Save message to database
      const newMessage = new Message({ sender, receiver, message: msg, roomName: room });
      await newMessage.save();

      // Emit message to everyone in the room
      io.to(room).emit('chat message', newMessage);

      console.log("Message value is ", msg);
    } catch (error) {
      console.error("Error saving message to database", error);
    }
  });
 } catch (error) {
  console.log(error)
 }

  // Update message status when read by the receiver
 
  socket.on('disconnect', async () => {
    console.log(`User ${user1} disconnected`);
    if (user1) {
      try {
        // Update user status to offline in the database
        const user = await User.findOneAndUpdate({ username: user1 }, { status: "offline" }, { new: true });

        if (user) {
          console.log(`User ${user1} status updated to offline`);
        } else {
          console.log("User not found in the database for offline update");
        }
      } catch (error) {
        console.error("Error updating user status to offline", error);
      }
    }
  });
});





//middleware



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
// Define your route handlers here

connectDB()
.then(()=>{
    server.listen(port,()=>{
        console.log(`Server started at ${port}`)
    })
})
.catch((error)=>{
    console.log(error)
})






app.post("/signup",async(req,res)=>{

    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please provide both username and password' });
    }
    const checkuser = await User.findOne({username})
    if(checkuser){
        return res.json({Error: "username already exist"})
    }
  
    try {
      const user = await User.create({ username, email, password });
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
    })
app.post("/login", async (req, res) => {
      const { username, password } = req.body;
    
      if (!(username && password)) {
        return res.status(400).json({ error: "Please provide complete information" });
      }
    
      try {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
        }
    
        const passwordMatch = await existingUser.isPasswordCorrect(password);
        if (!passwordMatch) {
          return res.status(401).json({ error: "Password is incorrect" });
        }
    
        const accessToken = await existingUser.generateAccessToken(existingUser._id);
        const refreshToken = await existingUser.generateRefreshToken(existingUser._id);
        existingUser.refreshToken = refreshToken;
        await existingUser.save();
    
        const options = {
          httpOnly: true,
          secure: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        };
    
        // Set cookies containing access token and refresh token
        res
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .status(200)
          .json({ message: "Login successful", user: existingUser, accessToken });
      } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }); 
app.post("/logout", verifyJWT,(req,res)=>{
     try {
       res.clearCookie('accessToken');
       res.clearCookie('refreshToken');
 
       return res.json({message:"Sucessfully logout"})
     } catch (error) {
      return res.json({message:"oi psyco login gar nah paila"})
     }
    })
app.post("/uploadProfilePicture", verifyJWT, upload.single('file'),async (req,res) => {
      try {
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ Error: "Invalid token for authentication", user});
        }
        if (!req.file) {
          return res.json({ Error: "No file uploaded" });
        }
        const cloudinaryResult = await uploadCloudinary(req.file.path);
        user.avatar = cloudinaryResult.url;

        await user.save();
       return res.status(200).json({ message: 'Profile picture uploaded successfully', user
      });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.json({ Error: "Profile picture not uploaded due to internal error" });
      }
    });
app.post("/uploadCoverPicture", verifyJWT, upload.single('file'),async (req,res) => {
      try {
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ Error: "Invalid token for authentication", user});
        }
        if (!req.file) {
          return res.json({ Error: "No file uploaded" });
        }
             //Cloudinary
        const cloudinaryResult = await uploadCloudinary(req.file.path);

        // user.coverImage = cloudinaryResult.url;
        user.coverImage = cloudinaryResult.url;

        await user.save();
        res.json({ message: 'Cover picture uploaded successfully',user });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.json({ Error: "Cover picture not uploaded due to internal error" });
      }
    });
app.post("/uploadBio",verifyJWT, async(req,res)=>{
const {bio}= req.body;
if(!bio){
  return res.json({error:"No biodata was provided",bio})
}
try {
  const user = await User.findById(req.user._id);
  if(!user){
    return res.json({error:"Error on token"})
  }
user.bioData = bio;
await user.save();
return res.json({message:"Sucessfully bioData was uploaded",user})
} catch (error) {
  return res.json({error:"internal mistake"})

}




});
app.get("/user", verifyJWT,async(req,res)=>{
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "No user" });
    }
    const user = await User.findById(req.user._id).select("-password  -refreshToken -createdAt -updatedAt -email -post");
    if (!user) {
      return res.status(401).json({ error: "Wrong token authentication" });
    }
    const userPosts = await Post.find({ uploader: req.user._id });
    return res.status(200).json({ message: "User's posts successfully fetched", user, userPosts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
})
app.post("/uploadPost", upload.single('image'), verifyJWT, async (req, res) => {
  try {
    // Find the authenticated user
    const user = await User.findById(req.user._id);
    
    // Get the user's avatar
    const userAvatar = user.avatar;
    
    let imageURL = null;

    // Check if a file was uploaded
    console.log(req.file)
    if (req.file) {
      // If a file was uploaded, upload it to Cloudinary
      const cloudinaryResult = await uploadCloudinary(req.file.path);
      imageURL = cloudinaryResult.url;
    }
  
    // Create a new post with the uploader, caption, and image URL
    const newPost = new Post({
      uploader: req.user._id, // User ID of the authenticated user
      caption: req.body.caption,
      imageURL: imageURL?imageURL:null
    });
    // Save the post to the database
    await newPost.save();
    // Return a success response with the new post and the user's avatar
    return res.status(201).json({ 
      message: 'Post uploaded successfully', 
      newPost, 
      post: {
        imageURL,
        userAvatar
      } 
    });
  } catch (error) {
    console.error('Error uploading post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/posts/:postId', verifyJWT, async (req, res) => {
  const postId = req.params.postId;
  try {
    // Find the user by their ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the post by its ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Ensure that the logged-in user is the owner of the post
    if (post.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized: You do not have permission to delete this post' });
    }

    
    await Post.findByIdAndDelete(postId);

    // Save the updated user
    await user.save();

    // Optionally, delete the post document from the posts collection

    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the page number from query parameters, default to 1
    const limit = parseInt(req.query.limit) || 10; // Set a default limit of 10 posts per page

    const startIndex = (page - 1) * limit; // Calculate the start index of posts for the current page
    const endIndex = page * limit; // Calculate the end index of posts for the current page

    const totalPosts = await Post.countDocuments(); // Count the total number of posts

    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Sort posts by createdAt timestamp in descending order (newest first)
      .skip(startIndex) // Skip posts that are before the start index
      .limit(limit) // Limit the number of posts per page
      .populate({
        path: 'comments',
        populate: {
          path: 'commentor',
          model: 'User'
        }
      })
      .populate('uploader', 'username avatar');

    // Construct pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit), // Calculate total number of pages
      totalPosts
    };

    // Construct response object
    const response = {
      posts,
      pagination
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/follow",async(req,res)=>{
try {
  const {followerId,followingId} = req.body
  const alreadyFollowedCase = await Follow.findOne({follower:followerId,following:followingId});
  if(alreadyFollowedCase){
    res.status(400).json({message:"Already following or being followed"});
  }
  // Create a follow user
  const follow = new Follow({
    followers:followerId,
    following:followingId
    });
    
    // Saving the follow user
    await follow.save();
    return res.status(200).json({Message:"Follow is sucessfully done",follow})
} catch (error) {
  console.log(error)
  return res.status(404).json(error)
}
  
})
app.get("/profile/:username", async (req, res) => {
  try {
    const username = req.params.username;
    
    // Verify params
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userPosts = await Post.find({ uploader: user._id }).sort({ createdAt: -1 }) // Sort posts by createdAt timestamp in descending order (newest first)
                                   .populate({
                                     path: 'comments',
                                     populate: {
                                       path: 'commentor',
                                       model: 'User'
                                     }
                                   })
                                   .populate('uploader', 'username avatar');
const countPost = await Post.countDocuments({uploader: user._id});
const countLike = await Like.countDocuments({author: user._id});

    return res.status(200).json({ 
      message: "Successfully fetched user details and posts", 
      user: {
        user_id: user._id,
        username: user.username,
        avatar: user.avatar? user.avatar: "https://static-00.iconduck.com/assets.00/avatar-default-icon-1975x2048-2mpk4u9k.png",
        coverImage: user.coverImage? user.coverImage :  "https://fbcoverstreet.com/thumbnail/QMtGHymlbERllAw8YRj6BhcBdrE4Jghk9sKDsYm2LUw9cbH7JsHVr3RssrlYusc4.webp",
        bio: user.bioData? user.bioData: "No! This user has nothing to say to anyone😣",
        status:user.status
        // Add other user details you want to send
      },
      posts: userPosts,
      countPost,
      countLike
    });  
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.post('/:post_id/comment', verifyJWT, async (req, res) => {
  try {
    // Find the authenticated user
    const _user = await User.findById(req.user._id);
    if (!_user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const commenterName = _user.username;
    if (!commenterName) {
      return res.status(404).json({ message: 'Username of commentor not found' });
    }

    const { comment } = req.body;
    const post_id = req.params.post_id;

    // Create new comment
    const new_comment = new Comment({ post_id, commentor: req.user._id, comment });
    const savedComment = await new_comment.save();

    // Update post document to include comment ID and commenter name
    await Post.updateOne({ _id: post_id }, { $push: { comments:  new_comment._id } });

    const comment_with_user = await Comment.findById(savedComment._id).populate('commentor');
    res.status(201).json({ message: "Comment successfully added", savedComment:{
      comment_id:comment_with_user._id,
      comment,

    } });
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message });
  }
});
app.get('/likecount/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const likeDetails = await Like.aggregate([
      {
        $match: { post: new mongoose.Types.ObjectId(postId) }
      },
      {
        $group: {
          _id: '$post',
          count: { $sum: 1 },
          liked_users: { $push: '$user' } // Accumulate user IDs who liked the post
        }
      }
    ]);

    let likeCount = 0;
    let likedUserNames = [];

    if (likeDetails.length > 0) {
      likeCount = likeDetails[0].count;
      const userIds = likeDetails[0].liked_users;

      // Fetch usernames for user IDs
      const users = await User.find({ _id: { $in: userIds } }, 'username');
      likedUserNames = users.map(user => user.username);
    }

    res.json({ count: likeCount, liked_users: likedUserNames });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.post('/:postId/like', verifyJWT, async (req, res) => {
  try {
    // Check if the user has already liked the post
    
    const existingLike = await Like.findOne({ user: req.user.id, post: req.params.postId });
    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this post' });
    }
    const post = await Post.findById(req.params.postId);
    console.log(post)
    const author = post.uploader;
    console.log("author is : ",author)
    // If the user hasn't liked the post yet, create a new like
    const like = new Like({
      user: req.user.id,
      author,
      post: req.params.postId
    });
    await like.save();
    res.status(201).json({ message: 'Post liked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.post('/:postId/unlike', verifyJWT, async (req, res) => {
  try {
    // Check if the user has liked the post before
    const existingLike = await Like.findOne({ user: req.user.id, post: req.params.postId });
    if (!existingLike) {
      return res.status(400).json({ message: 'You have not liked this post yet' });
    }

    // If the user has liked the post, delete the like
    await Like.findOneAndDelete({ user: req.user.id, post: req.params.postId });
    res.status(204).json({ message: 'Post unliked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
app.post('/chats/send', verifyJWT, async (req, res) => {
  try {
    const { senderUsername, receiverUsername, message } = req.body;
    
    // Assuming you have a User model defined
    const sender = await User.findOne({ username: senderUsername });
    const receiver = await User.findOne({ username: receiverUsername });

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'Sender or receiver not found' });
    }

    const chat = new Chat({ sender: sender._id, receiver: receiver._id, message });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/chats/:senderUsername/:receiverUsername', verifyJWT, async (req, res) => {
  try {
    const { senderUsername, receiverUsername } = req.params;
    
    // Assuming you have a User model defined
    const sender = await User.findOne({ username: senderUsername });
    const receiver = await User.findOne({ username: receiverUsername });

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const chats = await Chat.find({
      $or: [
        { sender: sender._id, receiver: receiver._id },
        { sender: receiver._id, receiver: sender._id }
      ]
    }).sort({ timestamp: 1 });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users', verifyJWT, async(req,res)=>{

const user_list = await User.aggregate([
  {$project:{
    _id:1,
    username:1,
    avatar:1,
    createdAt:1,
    status:1
  }}
]);
res.status(201).json({user_list})
})















