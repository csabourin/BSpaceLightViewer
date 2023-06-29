const express = require("express");
const session = require("express-session");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const xml2js = require("xml2js");
const parser = new xml2js.Parser();
const ejs = require("ejs");
const AdmZip = require("adm-zip");
const path = require("path");
const os = require("os");
const multer = require("multer"); // used for uploading files
const mime = require('mime-types'); 
const bodyParser = require("body-parser");
const sanitize = require("sanitize-filename");
const app = express();
let tempDir = os.tmpdir();
app.use(
  session({
    secret: process.env.SECRET,
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

const upload = multer({ storage: storage });
app.set("view engine", "ejs");
app.use(bodyParser.json()); // used for renaming files
app.use(bodyParser.urlencoded({ extended: true }));
let manifest = null;
let imsPackagePath = null;

function getPackages() {
  return new Promise((resolve, reject) => {
    fs.readdir("./packages", (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}
const readPackage = (packagePath, session) => {
  return new Promise((resolve, reject) => {
    imsPackagePath = path.join("./packages/", packagePath);
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
            session.manifests[packagePath] = manifestItems.map((item) => {
              const moduleTitle = item.title[0];
              const items = item.item
                ? item.item
                    .map((i) => {
                      const itemResource = resources.find(
                        (r) => r.$.identifier === i.$.identifierref
                      );
                      if (
                        itemResource &&
                        itemResource.$["d2l_2p0:material_type"] !== "content"
                      ) {
                        return null;
                      }
                      const href = itemResource
                        ? `${itemResource.$.href}`
                        : null;
                      return {
                        title: i.title[0],
                        href,
                      };
                    })
                    .filter((i) => i !== null)
                : []; // filter out null values

              return {
                moduleTitle,
                items,
                filename: extractionPath,
              };
            });
            resolve(session.manifests[packagePath]);
          });
        }
      );
    });
  });
};

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

  fs.rename(oldName, newName, function (err) {
    if (err) {
      console.log(err);
      res.status(500).send();
    } else {
      console.log("Successfully renamed - AKA moved!");
      res.status(200).send();
    }
  });
});

app.post("/upload", upload.single("zipFile"), (req, res) => {
  console.log(req.file);

  // After successful upload, send a response
  res.redirect("/");
});
app.get("/load/:filename", async (req, res) => {
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
    res.redirect(`/resource/${encodeURIComponent(firstResourceId)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing the package");
  }
});
app.use("/shared", express.static("shared"));
app.get("/resource/:id", (req, res) => {
  const id = req.params.id;
  let resource = null;
  let filename = null;
  for (let key in req.session.manifests) {
    let manifest = req.session.manifests[key];
    for (let module of manifest) {
      resource = module.items.find((i) => i.title === id);
      if (resource) {
        filename = key; // Get the filename from the key in the session manifest
        break;
      }
    }
    if (resource) {
      break;
    }
  }

  if (!resource) {
    // res.status(404).send("Resource not found");
    res.redirect("/");
    return;
  }

  const manifest = req.session.manifests[filename];

  if (!manifest) {
    res.status(500).send("Manifest not found in session");
    return;
  }
  const moduleIndex = manifest.findIndex((m) =>
    m.items.find((i) => i.title === id)
  );
  const module = manifest[moduleIndex];

  if (!module) {
    res.status(404).send("Module not found");
    return;
  }
  const resourceIndex = module.items.findIndex((i) => i.title === id);
  resource = module.items[resourceIndex];
  let prevResource = module.items[resourceIndex - 1];
  let nextResource = module.items[resourceIndex + 1];

  // If the nextResource does not exist in the current module,
  // fetch the first item from the next module as the nextResource
  if (!nextResource && manifest[moduleIndex + 1]) {
    nextResource = manifest[moduleIndex + 1].items[0];
  }
  if (!prevResource && manifest[moduleIndex - 1]) {
    let lastOfPrevious = manifest[moduleIndex - 1].items.length;
    prevResource = manifest[moduleIndex - 1].items[lastOfPrevious - 1];
  }

  // Use express.static as middleware inside this route handler
  let basePath = path.join(os.tmpdir(), path.basename(filename, ".zip"));
  req.session.currentBasePath = basePath;
  express.static(basePath)(req, res, () => {
    res.render("resource", {
      resource,
      prevResource,
      nextResource,
      manifest, // pass the manifest to the view
      currentPage: id,
      req,
    });
  });
});
app.get("/page/*", (req, res) => {
  const filePath = path.join(req.session.currentBasePath, req.params[0]); // Get the base path from the session

  const stream = fs.createReadStream(filePath);
  const mimeType = mime.lookup(filePath); // determines the MIME type based on the file extension

  if (!mimeType) {
    res.status(500).send("Could not determine file type");
    return;
  }

  res.setHeader("Content-Type", mimeType);
  
  stream.on('error', function(error) {
    res.status(500).send("Error reading file");
  });

  stream.pipe(res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});