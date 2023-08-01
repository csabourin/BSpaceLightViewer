// routes/load.js
const express = require("express");
const router = express.Router();
const sanitize = require("sanitize-filename");
const fs = require("fs");
const path = require("path");
const { readPackage } = require("../utils.js");
const { serveResource } = require("./resource.js");

// Load a package from a given filename
router.get("/:filename", async (req, res, next) => {
  try {
    // Sanitize filename before use
    const filename = sanitize(req.params.filename);

    // Check if the file exists in the package folder
    const filePath = path.join('./packages', filename);
    if (!fs.existsSync(filePath)) {
      // If file does not exist, pass an error to the error handling middleware
      return next({code: 'ENOENT', message: "File not found"});
    }

    // Read the package and load resources
    const manifest = await readPackage(filename, req.session);

    // Ensure the manifest is loaded and the first module has items
    if (!manifest || !manifest[0] || !manifest[0].items || !manifest[0].items[0]) {
      throw new Error("Invalid manifest");
    }

    // Get the first resource id from the manifest
    const firstResourceId = manifest[0].items[0].identifier;

    // Redirect to the resource page
    const manifestLanguage = req.query.lang;
    serveResource(req, res, next, firstResourceId, manifestLanguage);
  } catch (error) {
    // Pass the error to your error handling middleware
    next(error);
  }
});

module.exports = router;
