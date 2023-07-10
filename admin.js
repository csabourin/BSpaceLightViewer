module.exports = function(app) {
const express = require("express");
const multer = require("multer"); // used for uploading files
const fs = require("fs-extra");
const path = require("path");
const StreamZip = require("node-stream-zip");
const { checkForImsmanifest, getPackages  } = require('./utils.js');
const sanitize = require("sanitize-filename");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./packages/");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});
  
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 160, // limit uploaded file size to 160MB
  },
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname) !== ".zip") {
      req.fileValidationError =
        '<p>Only .zip files are allowed</p> <a href="/">Back</a>'; // Assign custom error message
      return cb(null, false); // Pass false as acceptance status
    }
    cb(null, true);
  },
});

// array of allowed IP addresses
let allowedIps = process.env.ALLOWED_IP.split(",");

// middleware function to check the IP
function checkIP(req, res, next) {
  let clientIp = req.ip;
  
  if (allowedIps.includes(clientIp)) {
    next();
  } else {
    res.status(403).send('Access denied');
  }
}

app.get("/adminconsole", checkIP ,async (req, res) => {
  const packageFiles = await getPackages();
  res.render("upload", { packageFiles });
});

app.post("/rename", checkIP ,async (req, res) => {
  const oldName = path.join(__dirname, "packages", sanitize(req.body.old));
  const newName = path.join(__dirname, "packages", sanitize(req.body.new));

  // Check if new file already exists
  fs.access(newName, fs.constants.F_OK, (err) => {
    if (!err) {
      // If the file exists, send an error response
      res.status(400).send("A file with the same name already exists");
    } else {
      // If the file does not exist, proceed with renaming
      fs.rename(oldName, newName, function (err) {
        if (err) {
          console.log(err);
          res.status(500).send();
        } else {
          console.log("Successfully renamed - AKA moved!");
          res.status(200).send();
        }
      });
    }
  });
});

app.post(
  "/upload", checkIP ,
  upload.single("zipFile"),
  checkForImsmanifest,
  (req, res) => {
    res.redirect("/");
  }
);
}
