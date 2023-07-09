const fs = require("fs-extra");
const xml2js = require("xml2js");
const AdmZip = require("adm-zip");
const StreamZip = require("node-stream-zip");
const path = require("path");
const os = require("os");
const entities = require("entities");
let tempDir = os.tmpdir();
const parser = new xml2js.Parser();

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

function getPackages() {
  return new Promise((resolve, reject) => {
    fs.readdir("./packages", (err, files) => {
      if (err) {
        reject(err);
      } else {
        if (files.length == 0) {
          resolve({
            title: "No file found",
            file: null,
            lang: "en-ca",
          });
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
                    resolve({
                      title: "No file found",
                      file: null,
                      lang: "en-ca",
                    });
                  }
                });
              })
          );

          Promise.all(promises)
            .then((data) => resolve(data))
            .catch((err) => reject(err));
        }
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
        resourceCode: i.$['d2l_2p0:resource_code'] || null,
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
              result.manifest.metadata[0]["imsmd:lom"][0]["imsmd:general"][0]["imsmd:title"][0]["imsmd:langstring"][0];
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
  checkForImsmanifest,flattenItems,getPackages, processItems, readPackage
};
