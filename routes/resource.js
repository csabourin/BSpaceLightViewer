const express = require('express');
const router = express.Router();
const path = require("path");
const {  flattenItems } = require("../utils.js");
const checkSession = require("../middleware/checkSession");

function serveResource(req, res, id, lang) {
  const manifestLanguage = lang;
  let resource = null;
  let filename = null;
  let isModule = null;
  let allItems = [];

  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    let localAllItems = []; // Items for the current manifest only

    manifest.forEach((isModule) => {
      localAllItems = localAllItems.concat(flattenItems(isModule.items));
    });

    let found = searchModules(manifest, id);
    if (found) {
      resource = found.item;
      filename = key;

      // If we found the resource, calculate prevResource and nextResource based on the current manifest only
      const resourceIndex = localAllItems.findIndex(
        (item) => item.identifier === id
      );
      const prevResource =
        resourceIndex > 0 ? localAllItems[resourceIndex - 1] : false;
      const nextResource = localAllItems[resourceIndex + 1];

      // Set in session or elsewhere for use in rendering
      req.session.prevResource = prevResource;
      req.session.nextResource = nextResource;

      break;
    }
  }

  function searchItems(items, identifier) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].identifier === identifier) {
        return { item: items[i], index: i };
      } else if (items[i].type === "contentmodule") {
        let found = searchItems(items[i].items, identifier);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  function searchModules(modules, identifier) {
    for (let m of modules) {
      let found = searchItems(m.items, identifier);
      if (found) {
        isModule = m;
        return found;
      }
    }
    return null;
  }

  function getHrefByResourceCode(array, resourceCode) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].resourceCode === resourceCode) {
        return array[i].href;
      }
    }
    return null;
  }

  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    let found = searchModules(manifest, id);
    if (found) {
      resource = found.item;
      filename = key;
      break;
    }
  }

  if (!resource) {
    res.redirect("/");
    return;
  }

  const manifest = req.session.manifests[filename];
  const courseTitle = req.session.courseTitles[filename];

  if (!manifest) {
    res.status(500).send("Manifest not found in session");
    return;
  }

  if (!isModule) {
    res.status(404).send("Module not found");
    return;
  }

  const resourceIndex = allItems.findIndex((item) => item.identifier === id);
  if (!resource) {
    res.status(404).send("Resource not found");
    return;
  }

  let basePath = path.join("../server-files/", path.basename(filename, ".zip"));
  req.session.currentBasePath = basePath;
  express.static(basePath)(req, res, () => {
    res.render("resource", {
      resource,
      prevResource: req.session.prevResource,
      nextResource: req.session.nextResource,
      manifest, // pass the manifest to the view
      description: isModule.description,
      currentPage: id,
      req,
      manifestLanguage,
      courseTitle,
    });
  });
};

router.get("/:id", checkSession, (req, res) => {
  serveResource(req, res, req.params.id, req.query.lang);
});

module.exports = router; // Export only the router object

router.serveResource = serveResource; // Attach the serveResource function to the router object