module.exports = function(app) {
  const multer = require("multer"); // used for uploading files
  const fs = require("fs-extra");
  const path = require("path");
  const AdmZip = require("adm-zip");
  const { checkForImsmanifest, getPackages, checkIP } = require('../utils.js');
  const sanitize = require("sanitize-filename");
  const bodyParser = require("body-parser");
  const createDOMPurify = require('dompurify');
  const { JSDOM } = require('jsdom');
  const authMiddleware = require('../middleware/authMiddleware.js');
  const imageUpload = require('../middleware/imageUpload.js');
  const upload = require('../middleware/upload.js');

  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  app.use(bodyParser.json()); // used for renaming files
  app.use(bodyParser.urlencoded({ extended: true }));

  const adminPassword = process.env.ADMPASS || 'I have been and always shall be your friend';
  app.post('/login', (req, res) => {
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
    const oldTempDir = path.join("./tmp", sanitize(path.basename(req.body.old, '.zip'))); // Temporary directory corresponding to the oldName

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
    bodyParser.json(),
    async (req, res) => {
      const description = req.body.description;
      const tags = req.body.tags;
      const zipFileName = req.body.zipFileName;

      // Validate and sanitize input
      if (typeof description !== "string" || !Array.isArray(tags)) {
        return res.status(400).send("Invalid input data");
      }

      const sanitizedDescription = DOMPurify.sanitize(description);
      const sanitizedTags = tags.map((tag) => DOMPurify.sanitize(tag.toString())); // ensuring each tag is a string

      const zipFilePath = path.join("./packages", sanitize(zipFileName));
      let tmpFolderPath = path.join(__dirname, '../tmp', path.basename(zipFileName, '.zip'), 'imsdescription.json'); // 

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
            zip.writeZip(zipPath, () => {
              // The zip file has been modified, so we delete the corresponding directory in ./tmp
              let tmpFolderPath = path.join(__dirname, '../tmp', path.basename(zipName, '.zip'), newFileName); // Removes the image from the temp directory
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
}