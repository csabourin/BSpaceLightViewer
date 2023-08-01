const express = require('express');
const router = express.Router();
const path = require("path");
const checkSession = require("../middleware/checkSession");
const { flattenItems } = require("../utils.js");
let statics = {};
function serveResource(req, res, next, id, lang) {
  const manifestLanguage = lang;
  let isModule = null;

  // Use the resource map to find the resource and its filename
  const mapEntry = req.session.resourceMap[id];
  if (!mapEntry) {
    next(new Error("Resource not found"));
    return;
  }

  const resource = mapEntry.resource;
  const filename = mapEntry.filename;
  const description = mapEntry.description;
  const manifest = req.session.manifests[filename];

  const allItems = flattenItems(manifest);

  const resourceIndex = allItems.findIndex((item) => item.identifier === id);
  const prevResource = resourceIndex > 0 ? allItems[resourceIndex - 1] : false;
  const nextResource = allItems[resourceIndex + 1];

  req.session.prevResource = prevResource;
  req.session.nextResource = nextResource;

  const courseTitle = req.session.courseTitles[filename];

  if (!manifest) {
    next(new Error("Manifest not found in session"));
    return;
  }

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
      req,
      manifestLanguage,
      courseTitle,
    });
  });
};

router.get("/:id", checkSession, (req, res, next) => {
  serveResource(req, res, next, req.params.id, req.query.lang);
});

module.exports = {
  router,
  serveResource
};
