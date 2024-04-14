// authMiddleware.js
const User = require('../model/user.model'); // Import your User model or whatever method you use to interact with user data

const authenticateSocket = async (socket, next) => {
  try {
    const isAuthenticated = socket.handshake.auth.isAuthenticated;
    // Perform authentication logic based on isAuthenticated flag
    if (!isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    // Fetch user information from the database or wherever it's stored
    const userId = req.user._id; // Assuming userId is provided during authentication
    const user = await User.findById(userId); // Adjust this according to your user data retrieval method

    if (!user) {
      throw new Error('User not found');
    }

    // Assign user object to socket.user
    socket.user = user;

    console.log('Authentication successful');
    // If authentication is successful, you may proceed with additional logic or simply call next()
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    next(error);
  }
};

module.exports = { authenticateSocket };
