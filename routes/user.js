const express = require('express');
const router = express.Router();


// unAuthorized routes
router.route("/signin").post(signin)
router.route("/login").post(loginUser)

module.exports = router;
