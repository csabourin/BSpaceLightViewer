const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./packages/");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});

module.exports = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 160, // limit uploaded file size to 160MB
  },
  fileFilter: function(req, file, cb) {
    if (path.extname(file.originalname) !== ".zip") {
      req.fileValidationError =
        '<p>Only .zip files are allowed</p> <a href="/">Back</a>'; // Assign custom error message
      return cb(null, false); // Pass false as acceptance status
    }
    cb(null, true);
  },
});
