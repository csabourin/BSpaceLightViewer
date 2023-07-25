const multer = require("multer");

module.exports = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "./tmp/");
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 5, // limit uploaded file size to 5MB
  },
  fileFilter: function(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      req.fileValidationError = '<p>Only image files are allowed</p> <a href="/">Back</a>';
      return cb(null, false);
    }
    cb(null, true);
  },
});
