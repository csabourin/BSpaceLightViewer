const express = require("express");
const router = express.Router();
const fs = require('fs-extra');
const mime = require('mime-types');
const path = require('path');
const checkSession = require("../middleware/checkSession");

router.get("/*", checkSession, (req, res) => {
  const requestedPath = req.params[0].replace(/\\/g, "/"); // Get the requested path, change backslashes to forward slashes.
  
  const filePath = path.join(req.session.currentBasePath, requestedPath); // Get the base path from the session

  // Check if the requested resource corresponds to a content module resource
  let contentModuleResource = null;
  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    for (let module of manifest) {
      contentModuleResource = module.items.find(
        (i) => i.title === requestedPath && i.type === "contentmodule"
      );
      if (contentModuleResource) {
        break;
      }
    }
    if (contentModuleResource) {
      break;
    }
  }

  if (contentModuleResource) {
    // If the requested resource is a content module resource, render the EJS template
    res.render("content-module", { module: contentModuleResource });
  } else {
    // If the requested resource is not a content module resource, serve the file
    const stream = fs.createReadStream(filePath);
    const mimeType = mime.lookup(filePath); // determines the MIME type based on the file extension
    if (!mimeType) {
      res.status(500).send("Could not determine file type");
      return;
    }
    res.setHeader("Content-Type", mimeType);
    stream.on("error", function(error) {
      res
        .status(404)
        .render("404", { title: "Page Not Found - Page introuvable" });
      console.log(error);
    });
    stream.pipe(res);
  }
});

module.exports = router;
