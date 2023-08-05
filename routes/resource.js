const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { flattenItems, readPackage } = require("../utils.js");
const sanitize = require("sanitize-filename");
let statics = {};

async function serveResource(req, res, next, filename, id) {
  // Sanitize filename before use
  filename = sanitize(filename);

// Read the manifest from the session or load it from the package
let manifest = req.session?.manifests?.[filename];
if (!manifest) {

  // Read the package and load resources
  manifest = await readPackage(filename, req.session);

  // Ensure the manifest is loaded and the first module has items
  if (!manifest || !manifest[0] || !manifest[0].items || !manifest[0].items[0]) {
    throw new Error("Invalid manifest");
  }

  // Check if the file exists in the package folder, but only for types that should have a file
  const mapEntry = req.session.resourceMap[id];
  if (mapEntry.resource.type !== 'contentmodule') {
    const filePath = path.join('./packages', filename);
    if (!fs.existsSync(filePath)) {
      // If file does not exist, pass an error to the error handling middleware
      return next({ code: 'ENOENT', message: "File not found" });
    }
  }


  // Read the package and load resources
  manifest = await readPackage(filename, req.session);

  // Ensure the manifest is loaded and the first module has items
  if (!manifest || !manifest[0] || !manifest[0].items || !manifest[0].items[0]) {
    throw new Error("Invalid manifest");
  }
}

    if (!req.session.resourceMap) {
    console.error('session.resourceMap is undefined');
    return res.status(500).send('An internal server error occurred');
  }

  
  const manifestLanguage = req.session.courseLanguages[filename];

  // Use the resource map to find the resource and its filename
  // console.log(req.session.resourceMap);
  const mapEntry = req.session.resourceMap[id];
  if (!mapEntry) {
    console.log(id);
    next(new Error("Resource not found"));
    return;
  }

  const resource = mapEntry.resource;
  const description = resource.description;
  const title = resource.title;

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
      title,
      currentPage: id,
      filename,
      req,
      manifestLanguage,
      courseTitle,
    });
  });
};

// This middleware function will intercept requests with images in it
// and redirect them to the /page endpoint instead of /resource
router.use('/:package/*', (req, res, next) => {
   const pathAfterPackage = req.params[0];
  const file=req.params.package;
  // Check if the filename ends with any of the common image extensions
  if (/\.(jpg|jpeg|png|gif|svg)$/.test(pathAfterPackage)) {
    // If it is an image, redirect the request to /page instead of /resource
    res.redirect(`/page/${file}/${pathAfterPackage}`);
  } else {
    // If it's not an image, just continue to the next middleware
    next();
  }
});


router.get("/:filename/:id", (req, res, next) => {
  req.session.currentPage=req.params.filename;
  serveResource(req, res, next, req.params.filename, req.params.id);
});

module.exports = {
  router,
  serveResource
};
