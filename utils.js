const fs = require("fs-extra");
const xml2js = require("xml2js");
const AdmZip = require("adm-zip");
const StreamZip = require("node-stream-zip");
const path = require("path");
const os = require("os");
const entities = require("entities");
let tempDir = os.tmpdir();
const parser = new xml2js.Parser();

// array of allowed IP addresses
let allowedIps = process.env.ALLOWED_IP.split(",");

// middleware function to check the IP
function checkIP(req, res, next) {
  let clientIp = req.ip;

  if (allowedIps.includes(clientIp)) {
    next();
  } else {
    res.status(403).send('Access denied')
    return false;
  }
}

function displayPI(req) {
  let clientIp = req.ip;
  return (allowedIps.includes(clientIp))
}

function checkForImsmanifest(req, res, next) {
  // Check for imsmanifest.xml in the zip when uploading
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

// function to gather all zip files, read imsmanifest.xml, imsdescription.json and get the image for the thumbnail
function getPackages() {
  return new Promise((resolve, reject) => {
    fs.readdir('./packages', async (err, files) => {
      if (err) {
        return reject(err);
      }

      if (files.length === 0) {
        return resolve([
          {
            title: 'No file found',
            file: null,
            lang: 'en-ca',
          },
        ]);
      }

      try {
        const promises = files.map((file) =>
          new Promise((resolve, reject) => {
            const absoluteZipPath = path.join(__dirname, './packages', file);
            const fileWithoutExt = path.basename(file, '.zip');
            const dirPath = path.join(__dirname, tempDir, fileWithoutExt);

            // Check if the directory exists
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }

            const zip = new StreamZip({ file: absoluteZipPath, storeEntries: true });

            zip.on('ready', () => {
              const imageEntry = Object.values(zip.entries()).find(entry => /^imsmanifest_image\.(jpg|png|jpeg|gif)$/i.test(entry.name));
              const xmlEntry = Object.values(zip.entries()).find(entry => entry.name === 'imsmanifest.xml');
              const jsonEntry = Object.values(zip.entries()).find(entry => entry.name === 'imsdescription.json');

              let title = 'No manifest file found';
              let lang = 'en-ca';
              let imageUrl = imageEntry ? path.join('/thumbnails/', fileWithoutExt, imageEntry.name) : null;
              let description = '';
              let tags = [];

                            // Skipping the unzip process if the files already exist
              const imageExists = fs.existsSync(path.join(dirPath, imageEntry ? imageEntry.name : ''));
              const xmlExists = fs.existsSync(path.join(dirPath, xmlEntry ? xmlEntry.name : ''));
              const jsonExists = fs.existsSync(path.join(dirPath, jsonEntry ? jsonEntry.name : ''));

                const jsonPromise = jsonEntry && !jsonExists
                ? new Promise((jsonResolve, jsonReject) => {
                    zip.stream(jsonEntry.name, (err, stream) => {
                      if (err) {
                        jsonReject(err);
                      }

                      let jsonString = '';
                      stream.on('data', chunk => { jsonString += chunk; });
                      stream.on('end', () => {
                        try {
                          const jsonData = JSON.parse(jsonString);
                          description = jsonData.description;
                          tags = jsonData.tags;
                          jsonResolve();
                        } catch (err) {
                          jsonReject(err);
                        }
                      });
                    });
                  })
                : Promise.resolve();

               const imagePromise = imageEntry && !imageExists
                ? new Promise((imageResolve, imageReject) => {
                  const fileWithoutExt = path.basename(file, '.zip');
                  const dirPath = path.join(__dirname, tempDir, fileWithoutExt);
                  if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                  }
                  const imagePath = path.join(dirPath, imageEntry.name);
                  zip.extract(imageEntry.name, imagePath, err => {
                    if (err) {
                      console.error('Error extracting image from zip:', err);
                      imageReject(err);
                    } else {
                      imageUrl = path.join('/thumbnails/', fileWithoutExt, imageEntry.name);
                      imageResolve();
                    }
                  });
                })
                : Promise.resolve();

              const xmlPromise = xmlEntry && !xmlExists
                ? new Promise((xmlResolve, xmlReject) => {
                  zip.stream(xmlEntry.name, (err, stream) => {
                    if (err) {
                      xmlReject(err);
                    }

                    let xmlString = '';
                    stream.on('data', chunk => { xmlString += chunk; });
                    stream.on('end', () => {
                      try {
                        xml2js.parseString(xmlString, (err, result) => {
                          if (err) {
                            console.error('Error parsing XML:', err);
                            xmlReject(err);
                          } else {
                            const titleData = result.manifest.metadata[0]['imsmd:lom'][0]['imsmd:general'][0]['imsmd:title'][0]['imsmd:langstring'][0];
                            title = titleData._;
                            lang = titleData['$']['xml:lang'];
                            xmlResolve();
                          }
                        });
                      } catch (err) {
                        xmlReject(err);
                      }
                    });
                  });
                })
                : Promise.resolve();

              Promise.all([imagePromise, xmlPromise])
                .then(() => {
                  zip.close();
                  resolve({
                    file,
                    title,
                    lang,
                    imageUrl,
                    description,
                    tags,
                  });
                })
                .catch((err) => {
                  zip.close();
                  reject(err);
                });
            });

            zip.on('error', (err) => {
              zip.close();
              reject(err);
            });
          })
        );

        const data = await Promise.all(promises);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
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

function processItems(item, resources) {
  let description = item.$.description || null;
  let moduleTitle = item.title[0];
  let identifier = item.$.identifier;

  // Ensure description is HTML decoded
  if (description) {
    description = entities.decode(description);
  }

  const items = [];

  if (item.item) {
    items.push(...processSubItems(item.item, resources));
  }

  return {
    identifier,
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
        identifier: i.$.identifier,
        title: title,
        description: description,
        items: [],
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
        resourceCode: i.$["d2l_2p0:resource_code"] || null,
        identifier: i.$.identifier,
        title: i.title[0],
        href: `${itemResource.$.href}`,
      });
    }
  });

  return items;
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
        function(err, data) {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          parser.parseString(stripBom.default(data), function(err, result) {
            if (err) {
              console.error(err);
              reject(err);
              return;
            }

            const manifestItems =
              result.manifest.organizations[0].organization[0].item;
            const resources = result.manifest.resources[0].resource;
            const titleData =
              result.manifest.metadata[0]["imsmd:lom"][0]["imsmd:general"][0][
              "imsmd:title"
              ][0]["imsmd:langstring"][0];
            const courseTitle = titleData._;

            // Check if session.manifests is defined. If not, initialize it
            session.manifests = session.manifests || {};
            session.courseTitles = session.courseTitles || {};
            session.courseTitles[packagePath] = courseTitle;

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

module.exports = {
  checkForImsmanifest,
  flattenItems,
  getPackages,
  processItems,
  readPackage,
  checkIP,
  displayPI,
};  