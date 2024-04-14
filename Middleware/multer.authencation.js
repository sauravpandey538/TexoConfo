
// multerSetup.js
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public");
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

module.exports = upload;