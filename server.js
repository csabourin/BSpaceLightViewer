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
const multer = require("multer");
const app = express();
let tempDir = os.tmpdir();
app.use(
  session({
    secret: "bspaceLightViewer",
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
const basePath=path.basename(packagePath, ".zip")
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
                      const href = itemResource ? `${itemResource.$.href}`  : null;
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
  try {
    const packageFiles = await getPackages();
    res.render("index", { packageFiles });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error reading packages");
  }
});

app.post("/upload", upload.single("zipFile"), (req, res) => {});
app.get("/load/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
    // Sanitize filename before use
    // ...

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
  console.log(req.params);
    let resource = null;
    let filename = null;
    for (let key in req.session.manifests) {
      let manifest = req.session.manifests[key];
    for (let module of manifest) {
      resource = module.items.find((i) => i.title === id);
      if (resource) {
        console.log(resource);
        filename = key; // Get the filename from the key in the session manifest
        break;
      }
    }
    if (resource) {
      break;
    }
  }

  if (!resource) {
    res.status(404).send("Resource not found");
    return;
  }
  
  const manifest = req.session.manifests[filename];
  console.log(filename);

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
    prevResource = manifest[moduleIndex - 1].items[0];
  }

  // Use express.static as middleware inside this route handler
  let basePath=path.join(os.tmpdir(), path.basename(filename, ".zip"));
  console.log(`Basepath: `,basePath)
  app.use("/page", express.static(basePath));
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
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
