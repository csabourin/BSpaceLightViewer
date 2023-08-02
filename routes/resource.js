const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const checkSession = require("../middleware/checkSession");
const { flattenItems, readPackage } = require("../utils.js");
const sanitize = require("sanitize-filename");
let statics = {};

async function serveResource(req, res, next, filename, id, lang) {
  // Sanitize filename before use
  filename = sanitize(filename);

  // Read the manifest from the session or load it from the package
  let manifest = req.session?.manifests?.[filename];
  if (!manifest) {
    // Check if the file exists in the package folder
    const filePath = path.join('./packages', filename);
    if (!fs.existsSync(filePath)) {
      // If file does not exist, pass an error to the error handling middleware
      return next({ code: 'ENOENT', message: "File not found" });
    }

    // Read the package and load resources
    manifest = await readPackage(filename, req.session);

    // Ensure the manifest is loaded and the first module has items
    if (!manifest || !manifest[0] || !manifest[0].items || !manifest[0].items[0]) {
      throw new Error("Invalid manifest");
    }
  }

  // Now continue with your existing code
  const manifestLanguage = lang;

  // Use the resource map to find the resource and its filename
  const mapEntry = req.session.resourceMap[id];
  if (!mapEntry) {
    next(new Error("Resource not found"));
    return;
  }

  const resource = mapEntry.resource;
  const description = mapEntry.description;

  const allItems = flattenItems(manifest);

  const resourceIndex = allItems.findIndex((item) => item.identifier === id);
  const prevResource = resourceIndex > 0 ? allItems[resourceIndex - 1] : false;
  const nextResource = allItems[resourceIndex + 1];

  req.session.prevResource = prevResource;
  req.session.nextResource = nextResource;

  const courseTitle = req.session.courseTitles[filename];

  let basePath = path.join("./server-files/", path.basename(filename, ".zip"));

  // Check if express.static for this basePath already exists
  if (!statics[basePath]) {
    statics[basePath] = express.static(basePath); // If not, create and cache it
  }

  req.session.currentBasePath = basePath;

  statics[basePath](req, res, () => {
    res.render("resource", {
      resource,
      prevResource: req.session.prevResource,
      nextResource: req.session.nextResource,
      manifest, // pass the manifest to the view
      description,
      currentPage: id,
      filename,
      req,
      manifestLanguage,
      courseTitle,
    });
  });
};

router.get("/:filename/:id", checkSession, (req, res, next) => {
  serveResource(req, res, next, req.params.filename, req.params.id, req.query.lang);
});

module.exports = {
  router,
  serveResource
};
