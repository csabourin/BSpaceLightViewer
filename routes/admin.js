module.exports = function(app) {
  const express = require("express");
  const rateLimit = require('express-rate-limit');
  // const multer = require("multer"); // used for uploading files
  const fs = require("fs-extra");
  const path = require("path");
  const AdmZip = require("adm-zip");
  const { checkForImsmanifest, getPackages, checkIP } = require('../utils.js');
  const sanitize = require("sanitize-filename");
  const authMiddleware = require('../middleware/authMiddleware.js');
  const imageUpload = require('../middleware/imageUpload.js');
  const upload = require('../middleware/upload.js');

  const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts from this IP, please try again later.'
  });

  const adminPassword = process.env.ADMPASS || 'I have been and always shall be your friend'; // The admin password is a placeholder, please set ADMPASS in environment variables!
  app.post('/login', checkIP, loginLimiter, (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === adminPassword) {
      req.session.user = { username }; // you can store the whole user object if you have one
      res.sendStatus(200);
    } else {
      res.status(401).send('Invalid credentials');
    }
  });

  app.get('/login', (req, res) => {
    // Render a template for the login form
    res.render('login');
  });

  app.get("/adminconsole", checkIP, authMiddleware, async (req, res) => {
    const packageFiles = await getPackages();
    res.render("upload", { packageFiles });
  });

  app.post("/rename", checkIP, authMiddleware, async (req, res) => {
    const oldName = path.join("./packages", sanitize(req.body.old));
    const newName = path.join("./packages", sanitize(req.body.new));
    const oldTempDir = path.join("./server-files", sanitize(path.basename(req.body.old, '.zip'))); // Temporary directory corresponding to the oldName

    // Check if new file already exists
    fs.access(newName, fs.constants.F_OK, (err) => {
      if (!err) {
        // If the file exists, send an error response
        res.status(400).send("A file with the same name already exists");
      } else {
        // If the file does not exist, proceed with renaming
        fs.rename(oldName, newName, function(err) {
          if (err) {
            console.error(err);
            res.status(500).send();
          } else {
            console.log(`Successfully renamed - ${oldName} to ${newName}`);

            // Now delete the old temp directory
            fs.remove(oldTempDir, function(err) {
              if (err) {
                console.error(err);
                res.status(500).send(`Failed to delete temporary directory ${oldTempDir}`);
              } else {
                res.status(200).send();
              }
            });
          }
        });
      }
    });
  });

  app.post("/delete", checkIP, authMiddleware, async (req, res) => {
    const fileName = req.body.fileName;
    const filePath = path.join("./packages", sanitize(fileName));

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // If the file does not exist, send an error response
        res.status(400).send("The file does not exist");
      } else {
        // If the file exists, delete it
        fs.unlink(filePath, function(err) {
          if (err) {
            console.log(err);
            res.status(500).send();
          } else {
            console.log("Successfully deleted the package!");
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

  app.post(
    "/addDescription",
    checkIP,
    authMiddleware,
    express.json(),
    async (req, res) => {
      const description = req.body.description;
      const tags = req.body.tags;
      const zipFileName = req.body.zipFileName;

      // Validate and sanitize input
      if (typeof description !== "string" || !Array.isArray(tags)) {
        return res.status(400).send("Invalid input data");
      }

      const sanitizedDescription = description; // Output is escaped, sanitize only if you intent to include html
      const sanitizedTags = tags.map((tag) => tag.toString()); // ensuring each tag is a string

      const zipFilePath = path.join("./packages", sanitize(zipFileName));
      let tmpFolderPath = path.join('./server-files/thumbnails', path.basename(zipFileName, '.zip'), 'imsdescription.json'); // 

      // Check if zip file exists
      fs.access(zipFilePath, fs.constants.F_OK, (err) => {
        if (err) {
          // If the zip file does not exist, send an error response
          res.status(400).send("The zip file does not exist");
        } else {
          // If the zip file exists, add imsdescription.json to it
          const zip = new AdmZip(zipFilePath);

          // Create imsdescription.json content
          const jsonContent = JSON.stringify({
            description: sanitizedDescription,
            tags: sanitizedTags,
          });

          // Add imsdescription.json to the zip file
          zip.addFile("imsdescription.json", Buffer.from(jsonContent));

          // Write changes to the zip file
          zip.writeZip(zipFilePath, function(err) {
            if (err) {
              console.error("Error writing zip: ", err);
              res.status(500).send("Error writing zip file");
            } else {
              // Successfully written the zip, now delete the directory
              fs.remove(tmpFolderPath, (err) => {
                if (err) {
                  console.error('Failed to delete the temporary directory:', err);
                }
                else {
                  res
                    .status(200)
                    .send(
                      "Successfully added imsdescription.json to the zip file"
                    );
                }
              });
            }
          });
        }
      });
    }
  );


  app.post("/uploadImage", checkIP, authMiddleware, imageUpload.single('imageFile'), async (req, res) => {
    if (!req.file) {
      console.log('No file was uploaded or file upload was rejected');
      return res.status(400).send('No file was uploaded or file upload was rejected');
    }
    const imageName = req.file.originalname;
    const imagePath = path.join('./server-files/thumbnails', imageName);
    const zipName = req.body.zipFileName;
    const zipPath = path.join( './packages', zipName);
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
            zip.writeZip(zipPath, () => {
              // The zip file has been modified, so we delete the corresponding directory in ./server-files
              let tmpFolderPath = path.join( './server-files/thumbnails', path.basename(zipName, '.zip'), newFileName); // Removes the image from the temp directory
              fs.remove(tmpFolderPath, (err) => {
                if (err) {
                  console.log('Failed to delete the temporary directory:', err);
                }
              });
            });

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

  app.post('/replacePackage', checkIP, authMiddleware, upload.single('replacementPackage'), async (req, res) => {
    try {
      const originalPackageName = sanitize(req.body.originalPackageName);
      const tmpFolder = path.join('./server-files/thumbnails', path.basename(originalPackageName, '.zip'));
      const replacementPackage = sanitize(path.basename(req.file.originalname));

      console.log("replacement package: ", replacementPackage);
      console.log("Looking for tmp folder at: ", tmpFolder);
      if (!fs.existsSync(tmpFolder)) {
        console.log("The folder does not exist");
        res.status(400).send('Temp folder does not exist for this package');
        return;
      }
      console.log("Tmp folder exists. Contents: ", fs.readdirSync(tmpFolder));


      // Load the replacement package
      const newZip = new AdmZip(req.file.path);

      // Get the temporary files from the tmp folder
      const tmpFiles = fs.readdirSync(tmpFolder);

      // Add the temporary files to the replacement package
      for (const file of tmpFiles) {
        if (file !== 'imsmanifest.xml') {
          newZip.addLocalFile(path.join(tmpFolder, file));
        }
      }

      // Write the updated zip to the packages folder
      newZip.writeZip(path.join('./packages', replacementPackage), function(err) {
        if (err) {
          console.error("Error writing zip: ", err);
          res.status(500).send("Error writing zip file");
        } else {
          // Only if no error during writing zip, delete the original package
          fs.unlink(path.join( './packages', originalPackageName), function(err) {
            if (err) {
              console.error("Error deleting original package: ", err);
              res.status(500).send("Error deleting original package");
            } else {
              console.log("Successfully replaced the package");
              res.redirect("/adminconsole");
            }
          });
        }
      });
    } catch (err) {
      res.status(500).send('An error occurred');
      console.error(err);
    }
  });

}