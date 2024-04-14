const jwt = require("jsonwebtoken");
const User = require("../model/user.model");

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ error: "No token found" });
        }
        
        const decodedToken = jwt.verify(token, "Kalo@#Access");
        const user = await User.findById(decodedToken._id);
        
        if (!user) {
            return res.status(401).json({ error: "Invalid access token" });
        }

        // Attach user object to the request for further processing
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: "Invalid access token" });
    }
};

module.exports = verifyJWT;
