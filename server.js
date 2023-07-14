const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const fs = require("fs-extra");
const ejs = require("ejs"); // required for templates
//Todo: require("matomo-tracker")
const path = require("path");
const os = require("os");
const mime = require("mime-types");
const sanitize = require("sanitize-filename");
const {
  checkForImsmanifest,
  flattenItems,
  getPackages,
  readPackage,
  displayPI,
} = require("./utils.js");
const app = express();
app.use(
  session({
    secret: process.env.SECRET || "GetTheCheeseToSickBay",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: true }, // added security flags
  })
);

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 2400, // limit each IP to 1200 requests per windowMs
  message: "<h1>Too many requests from this IP, please try again after 2 minutes.</h1> <hr> <h1>Trop de requêtes venant de cette adresse IP, veuillez essayer de nouveau dans 2 minutes.</h1>",
});

// Middleware to check for active session
function checkSession(req, res, next) {
  if (!req.session.manifests) {
    // Redirect to home page if there is no active session
    req.session.sessionEnded = true;
    return res.redirect("/");
  }
  next();
}
app.set("view engine", "ejs");
app.set("trust proxy", true);
app.use(limiter);

app.get("/", async (req, res) => {
  // Check if sessionEnded flag is set
  const sessionEnded = req.session.sessionEnded;
  const displayPIsymbol = displayPI(req);
  // Remove the flag from the session
  req.session.sessionEnded = null;
  // index page, lists the files
  try {
    const packageFiles = await getPackages();
    res.render("index", { packageFiles, sessionEnded, displayPIsymbol });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error reading packages");
  }
});
require("./admin.js")(app);
app.get("/load/:filename", async (req, res) => {
  const manifestLanguage = req.query.lang;
  try {
    const rawFilename = req.params.filename;
    // Sanitize filename before use
    const filename = sanitize(rawFilename);

    // Read the package and load resources
    const manifest = await readPackage(filename, req.session);

    // Ensure the manifest is loaded and the first module has items
    if (
      !manifest ||
      !manifest[0] ||
      !manifest[0].items ||
      !manifest[0].items[0]
    ) {
      console.error("Invalid manifest");
      res.status(500).send("Invalid manifest");
      return;
    }

    // Get the first resource id from the manifest
    const firstResourceId = manifest[0].items[0].identifier;

    // Redirect to the resource page
    res.redirect(
      `/resource/${encodeURIComponent(
        firstResourceId
      )}?lang=${manifestLanguage}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing the package");
  }
});
app.use("/shared", express.static("shared"));
app.use("/public", express.static("public"));
app.get("/content/enforced/*/*", (req, res) => {
  // The wildcard '*' in the route path will match any string
  // The 'req.params[0]' will return the first matched string (course code in this case)
  // The 'req.params[1]' will return the second matched string (file-or-path in this case)
  const redirectedPath = `/page/${req.params[1]}`;
  res.redirect(redirectedPath);
});
app.use("/d2l/common/dialogs/quickLink/quickLink.d2l", function(req, res) {
  const resourceCode = req.query.rcode;
  let href = null;

  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    let foundHref = getHrefByResourceCode(flattenItems(manifest), resourceCode);
    if (foundHref) {
      href = foundHref;
      break;
    }
  }

  function getHrefByResourceCode(array, resourceCode) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].resourceCode === resourceCode) {
        return array[i].href;
      }
    }
    return null;
  }

  if (!href) {
    let originalUrl = req.headers.referer || "/";
    res.render("messagePage", { currentpage: originalUrl });
    return;
  }

  // Return the href
  res.redirect(`/page/${href}`);
});
app.get("/resource/:id", checkSession, (req, res) => {
  const manifestLanguage = req.query.lang;
  const id = req.params.id;
  let resource = null;
  let filename = null;
  let module = null;
  let allItems = [];

  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    let localAllItems = []; // Items for the current manifest only

    manifest.forEach((module) => {
      localAllItems = localAllItems.concat(flattenItems(module.items));
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
        module = m;
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

  if (!module) {
    res.status(404).send("Module not found");
    return;
  }

  const resourceIndex = allItems.findIndex((item) => item.identifier === id);
  if (!resource) {
    res.status(404).send("Resource not found");
    return;
  }

  let basePath = path.join(os.tmpdir(), path.basename(filename, ".zip"));
  req.session.currentBasePath = basePath;
  express.static(basePath)(req, res, () => {
    res.render("resource", {
      resource,
      prevResource: req.session.prevResource,
      nextResource: req.session.nextResource,
      manifest, // pass the manifest to the view
      description: module.description,
      currentPage: id,
      req,
      manifestLanguage,
      courseTitle,
    });
  });
});

app.get("/page/*", checkSession, (req, res) => {
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

app.use('/tmp', express.static(path.join(__dirname, 'tmp')));

// Catch-all middleware for any invalid URL
app.use(function(req, res) {
  res.status(404).render("404", { title: "Page Not Found - Page introuvable" });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  const options = { timeZone: "America/New_York", hour12: false };
  const startTime = new Date().toLocaleTimeString("en-CA", options);
  console.log(`App listening on port ${port}`);
  console.log("Server started at:", startTime);
});
