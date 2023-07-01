const express = require("express");
const session = require("express-session");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const xml2js = require("xml2js");
const parser = new xml2js.Parser();
const ejs = require("ejs");
const AdmZip = require("adm-zip");
const StreamZip = require("node-stream-zip");
const path = require("path");
const os = require("os");
const multer = require("multer"); // used for uploading files
const mime = require("mime-types");
const bodyParser = require("body-parser");
const entities = require("entities");
const sanitize = require("sanitize-filename");
const rateLimit = require("express-rate-limit");
const app = express();
let tempDir = os.tmpdir();
app.use(
  session({
    secret: process.env.SECRET || "GetTheCheeseToSickBay",
    resave: false,
    saveUninitialized: false,
  })
);

let firstResourceId = null;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./packages/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 60, // limit uploaded file size to 60MB
  },
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname) !== ".zip") {
      req.fileValidationError =
        '<p>Only .zip files are allowed</p> <a href="/">Back</a>'; // Assign custom error message
      return cb(null, false); // Pass false as acceptance status
    }
    cb(null, true);
  },
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.set("view engine", "ejs");
app.use(bodyParser.json()); // used for renaming files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);
let manifest = null;
let imsPackagePath = null;

function getPackages() {
  return new Promise((resolve, reject) => {
    fs.readdir("./packages", (err, files) => {
      if (err) {
        reject(err);
      } else {
        const promises = files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const zip = new StreamZip({
                file: `./packages/${file}`,
                storeEntries: true,
              });

              zip.on("ready", () => {
                // Check if the manifest exists within the zip
                if (zip.entry("imsmanifest.xml")) {
                  // If it exists, extract it
                  zip.stream("imsmanifest.xml", (err, stm) => {
                    if (err) {
                      reject(err);
                    } else {
                      // Convert stream to string
                      const chunks = [];
                      stm.on("data", (chunk) => chunks.push(chunk));
                      stm.on("end", () => {
                        const xmlString = Buffer.concat(chunks).toString();

                        // Parse the XML string
                        xml2js.parseString(xmlString, (err, result) => {
                          if (err) {
                            reject(err);
                          } else {
                            // Get the title and xml:lang value
                            const titleData =
                              result.manifest.metadata[0]["imsmd:lom"][0][
                                "imsmd:general"
                              ][0]["imsmd:title"][0]["imsmd:langstring"][0];
                            const title = titleData._;
                            const lang = titleData["$"]["xml:lang"];

                            resolve({
                              file,
                              title,
                              lang,
                            });
                          }
                        });
                      });
                    }
                  });
                } else {
                  reject(new Error("imsmanifest.xml not found within zip"));
                }
              });
            })
        );

        Promise.all(promises)
          .then((data) => resolve(data))
          .catch((err) => reject(err));
      }
    });
  });
}
const readPackage = (packagePath, session) => {
  return new Promise((resolve, reject) => {
    const imsPackagePath = path.join("./packages/", packagePath);
    const basePath = path.basename(packagePath, ".zip");
    const extractionPath = path.join(tempDir, basePath);

    // Ensure the extraction directory exists
    fs.ensureDirSync(extractionPath);

    const zip = new AdmZip(imsPackagePath);

    // Ensure extractionPath is defined
    if (!extractionPath) {
      console.error("extractionPath is not defined");
      reject(new Error("extractionPath is not defined"));
      return;
    }

    zip.extractAllTo(extractionPath, /*overwrite*/ true);
    import("strip-bom").then((stripBom) => {
      fs.readFile(
        path.join(extractionPath, "imsmanifest.xml"),
        "utf8",
        function (err, data) {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          parser.parseString(stripBom.default(data), function (err, result) {
            if (err) {
              console.error(err);
              reject(err);
              return;
            }

            const manifestItems =
              result.manifest.organizations[0].organization[0].item;
            const resources = result.manifest.resources[0].resource;

            // Check if session.manifests is defined. If not, initialize it
            session.manifests = session.manifests || {};

            // Store the manifest in session.manifests with the package filename as the key
            session.manifests[packagePath] = manifestItems.map((item) =>
              processItems(item, resources)
            );

            resolve(session.manifests[packagePath]);
          });
        }
      );
    });
  });
};

function processItems(item, resources) {
  let description = item.$.description || null;
  let moduleTitle = item.title[0];

  // Ensure description is HTML decoded
  if (description) {
    description = entities.decode(description);
  }

  const items = [];

  if (item.item) {
    items.push(...processSubItems(item.item, resources));
  }

  return {
    moduleTitle,
    title: item.title[0],
    description,
    items: items,
  };
}

function processSubItems(subItems, resources) {
  const items = [];
  
  subItems.forEach((i) => {
    const itemResource = resources.find(
      (r) => r.$.identifier === i.$.identifierref
    );

    if (
      itemResource &&
      itemResource.$["d2l_2p0:material_type"] === "contentmodule"
    ) {
      const title = i.title[0];
      const description = i.$.description
        ? entities.decode(i.$.description)
        : null;

      const newItem = {
        type: "contentmodule",
        title: title,
        description: description,
        items: []
      };
      
      if (i.item) {
        newItem.items.push(...processSubItems(i.item, resources));
      }

      items.push(newItem);
    } else if (
      itemResource &&
      itemResource.$["d2l_2p0:material_type"] === "content"
    ) {
      items.push({
        type: "content",
        title: i.title[0],
        href: `${itemResource.$.href}`,
      });
    }
  });

  return items;
}


function checkForImsmanifest(req, res, next) {
  // Check for imsmanifest.xml in the zip
  const zip = new StreamZip({ file: req.file.path, storeEntries: true });

  zip.on("ready", () => {
    try {
      if (!zip.entry("imsmanifest.xml")) {
        req.fileValidationError =
          '<p>Zip files must contain an imsmanifest.xml file.</p> <a href="/">Back</a>';

        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("Deleted invalid file:", req.file.path);
          }
        });

        return res.status(400).send(req.fileValidationError);
      }
    } catch (err) {
      console.error("Error checking for imsmanifest.xml:", err);
    } finally {
      zip.close();
      if (!req.fileValidationError) {
        next();
      }
    }
  });
}

function flattenItems(items) {
  let flat = [];

  function _flattenItems(items) {
    items.forEach((item) => {
      if (item.type !== "contentmodule") {
        flat.push(item);
      }
      if (item.items) {
        _flattenItems(item.items);
      }
    });
  }

  _flattenItems(items);

  return flat;
}


app.get("/", async (req, res) => {
  // index page, lists the files
  try {
    const packageFiles = await getPackages();
    res.render("index", { packageFiles });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error reading packages");
  }
});
app.get("/adminconsole", async (req, res) => {
  const packageFiles = await getPackages();
  res.render("upload", { packageFiles });
});

app.post("/rename", async (req, res) => {
  const oldName = path.join(__dirname, "packages", sanitize(req.body.old));
  const newName = path.join(__dirname, "packages", sanitize(req.body.new));

  // Check if new file already exists
  fs.access(newName, fs.constants.F_OK, (err) => {
    if (!err) {
      // If the file exists, send an error response
      res.status(400).send("A file with the same name already exists");
    } else {
      // If the file does not exist, proceed with renaming
      fs.rename(oldName, newName, function (err) {
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
  "/upload",
  upload.single("zipFile"),
  checkForImsmanifest,
  (req, res) => {
    console.log(req.file);
    res.redirect("/");
  }
);
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
    const firstResourceId = manifest[0].items[0].title;

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
app.get("/resource/:id", (req, res) => {
  const manifestLanguage = req.query.lang;
  const id = req.params.id;
  let resource = null;
  let filename = null;
  let module = null;
  let allItems = [];
  
for (let key in req.session.manifests) {
  let manifest = req.session.manifests[key];
  let localAllItems = [];  // Items for the current manifest only
  
  manifest.forEach((module) => {
    localAllItems = localAllItems.concat(flattenItems(module.items));
  });

  let found = searchModules(manifest, id);
  if (found) {
    resource = found.item;
    filename = key;
    
    // If we found the resource, calculate prevResource and nextResource based on the current manifest only
    const resourceIndex = localAllItems.findIndex((item) => item.title === id);
    const prevResource = resourceIndex > 0 ? localAllItems[resourceIndex - 1] : false;
    const nextResource = localAllItems[resourceIndex + 1];

    // Set in session or elsewhere for use in rendering
    req.session.prevResource = prevResource;
    req.session.nextResource = nextResource;

    break;
  }
}


  function searchItems(items, title) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].title === title) {
        return { item: items[i], index: i };
      } else if (items[i].type === "contentmodule") {
        let found = searchItems(items[i].items, title);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  function searchModules(modules, title) {
    for (let m of modules) {
      let found = searchItems(m.items, title);
      if (found) {
        module = m;
        return found;
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

  if (!manifest) {
    res.status(500).send("Manifest not found in session");
    return;
  }

  if (!module) {
    res.status(404).send("Module not found");
    return;
  }

 const resourceIndex = allItems.findIndex((item) => item.title === id);
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
    });
  });
});

app.get("/page/*", (req, res) => {
  const requestedPath = req.params[0]; // Get the requested path
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
    stream.on("error", function (error) {
      res.status(500).send("Error reading file");
    });
    stream.pipe(res);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
