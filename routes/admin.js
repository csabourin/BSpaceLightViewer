module.exports = function(app) {
  const express = require("express");
  const multer = require("multer"); // used for uploading files
  const basicAuth = require('express-basic-auth');
  const fs = require("fs-extra");
  const path = require("path");
  const AdmZip = require("adm-zip");
  const { checkForImsmanifest, getPackages, checkIP } = require('../utils.js');
  const sanitize = require("sanitize-filename");
  const bodyParser = require("body-parser");

  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "./packages/");
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    },
  });

  const imageUpload = multer({
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

  const adminPassword = process.env.ADMPASS || 'I have been and always shall be your friend';
  const authMiddleware = basicAuth({
    users: { 'admin': adminPassword }, // password from process.env
    challenge: true
  });

  const upload = multer({
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

  app.use(bodyParser.json()); // used for renaming files
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get("/adminconsole", checkIP, authMiddleware, async (req, res) => {
    const packageFiles = await getPackages();
    res.render("upload", { packageFiles });
  });

  app.post("/rename", checkIP, authMiddleware, async (req, res) => {
    const oldName = path.join(__dirname, "packages", sanitize(req.body.old));
    const newName = path.join(__dirname, "packages", sanitize(req.body.new));

    // Check if new file already exists
    fs.access(newName, fs.constants.F_OK, (err) => {
      if (!err) {
        // If the file exists, send an error response
        res.status(400).send("A file with the same name already exists");
      } else {
        // If the file does not exist, proceed with renaming
        fs.rename(oldName, newName, function(err) {
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
    "/upload", checkIP, authMiddleware,
    upload.single("zipFile"),
    checkForImsmanifest,
    (req, res) => {
      res.redirect("/");
    }
  );
  app.post("/uploadImage", checkIP, authMiddleware, imageUpload.single('imageFile'), async (req, res) => {
    if (!req.file) {
      console.log('No file was uploaded or file upload was rejected');
      return res.status(400).send('No file was uploaded or file upload was rejected');
    }
    const imageName = req.file.originalname;
    const imagePath = path.join(__dirname, '../tmp', imageName);
    const zipName = req.body.zipFileName;
    const zipPath = path.join(__dirname, '../packages', zipName);
    const newFileName = 'imsmanifest_image' + path.extname(imageName);

    // Check if zip file exists
    fs.access(zipPath, fs.constants.F_OK, (err) => {
      if (err) {
        // If the zip file does not exist, send an error response
        res.status(400).send("The zip file does not exist");
      } else {
        // If the zip file exists, add image to it
        let zip = new AdmZip(zipPath);

        // Check if image already exists in the zip file
        const existingFile = zip.getEntry(newFileName);
        if (existingFile) {
          // If the image exists, delete it
          zip.deleteFile(existingFile);
        }

        // Add the new image to the zip file
        fs.exists(imagePath, (exists) => {
          if (exists) {
            zip.addLocalFile(imagePath, '', newFileName); // add the newFileName as the second parameter to rename the file inside the zip
            zip.writeZip(zipPath);

            // Delete image file after adding to zip
            fs.unlink(imagePath, (err) => {
              if (err) {
                console.log(err);
              }
            });

            res.redirect("/adminconsole");
          } else {
            console.error('File does not exist:', imagePath);
            res.status(500).send('Failed to add image to zip, file does not exist');
          }
        });
      }
    });
  });
}