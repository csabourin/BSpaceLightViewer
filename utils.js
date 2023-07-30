const fs = require("fs-extra");
const xml2js = require("xml2js");
const unzipper = require('unzipper');
const StreamZip = require("node-stream-zip");
const path = require("path");
const os = require("os");
const entities = require("entities");
let tempDir = "./server-files/";
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

function escapeSpecialChars(str) {
  return str.replace(/[\\"'&<>]/g, function(c) {
    switch (c) {
      case '"': return '\\"';
      case "'": return "\\'";
      case '\\': return '\\\\';
      case '&': return '\\&';
      case '<': return '\\<';
      case '>': return '\\>';
    }
  });
}

function displayPI(req) {
  let clientIp = req.ip;
  return (allowedIps.includes(clientIp))
}

function checkForImsmanifest(req, res, next) {
  // Check for imsmanifest.xml in the zip when uploading
  const sanitizedPath = path.normalize(req.file.path).replace(/^(\.\.[\/\\])+/, '');
  const zip = new StreamZip({ file: req.file.path, storeEntries: true });

  zip.on("ready", () => {
    try {
      if (!zip.entry("imsmanifest.xml")) {
        req.fileValidationError =
          '<p>Zip files must contain an imsmanifest.xml file.</p> <a href="/">Back</a>';

        fs.unlink(sanitizedPath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("Deleted invalid file:", sanitizedPath);
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
        const promises = files
          .filter(file => path.extname(file) === '.zip')  // Only process .zip files
          .map(file => processFile(file));
        const data = await Promise.all(promises);
        resolve(data.filter(item => item !== null));
      } catch (err) {
        reject(err);
      }

    });
  });
}

const processFile = async (file, retryCount = 0) => {
  const absoluteZipPath = path.join(__dirname, './packages', file);
  const fileWithoutExt = path.basename(file, '.zip');
  const dirPath = path.join(tempDir,'thumbnails', fileWithoutExt);

  // Check if the directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Check if files exist
  const xmlPath = path.join(dirPath, 'imsmanifest.xml');
  const jsonPath = path.join(dirPath, 'imsdescription.json');
  const imagePath = fs.readdirSync(dirPath).find(file => /^imsmanifest_image\.(jpg|png|jpeg|gif)$/i.test(file));

  const xmlExists = fs.existsSync(xmlPath);
  const jsonExists = fs.existsSync(jsonPath);
  const imageExists = !!imagePath;  // Convert imagePath to boolean

  let zip, entries;

  if (!xmlExists || !jsonExists || !imageExists) {
    zip = new StreamZip({ file: absoluteZipPath, storeEntries: true });
    try {
      entries = await getZipEntries(zip);
    } catch (err) {
      return handleZipError(err, file, retryCount, zip);
    }
  }

  let imageEntry, xmlEntry, jsonEntry;

  if (!xmlExists || !jsonExists || !imageExists) {
    zip = new StreamZip({ file: absoluteZipPath, storeEntries: true });
    try {
      entries = await getZipEntries(zip);
      imageEntry = entries.find(entry => /^imsmanifest_image\.(jpg|png|jpeg|gif)$/i.test(entry.name));
      xmlEntry = entries.find(entry => entry.name === 'imsmanifest.xml');
      jsonEntry = entries.find(entry => entry.name === 'imsdescription.json');
    } catch (err) {
      return handleZipError(err, file, retryCount, zip);
    }
  } else {
    const dirFiles = fs.readdirSync(dirPath);
    imageEntry = dirFiles.find(file => /^imsmanifest_image\.(jpg|png|jpeg|gif)$/i.test(file));
    xmlEntry = dirFiles.find(file => file === 'imsmanifest.xml') ? { name: 'imsmanifest.xml' } : null;
    jsonEntry = dirFiles.find(file => file === 'imsdescription.json') ? { name: 'imsdescription.json' } : null;
  }
  let title = 'No manifest file found';
  let lang = 'en-ca';
  let imageUrl = imageEntry ? path.join('/thumbnails/', fileWithoutExt, typeof imageEntry === 'string' ? imageEntry : imageEntry.name) : null;
  let description = '';
  let tags = [];

  try {
    if (!jsonExists && jsonEntry) {
      ({ description, tags } = await extractAndParseJSON(zip, jsonEntry, dirPath));
    } else if (jsonEntry) {
      ({ description, tags } = await parseJSONFile(path.join(dirPath, jsonEntry.name)));
    }

    if (!imageExists && imageEntry) {
      imageUrl = await extractImage(zip, imageEntry, dirPath, fileWithoutExt);
    }

    if (!xmlExists && xmlEntry) {
      ({ title, lang } = await extractAndParseXML(zip, xmlEntry, dirPath));
    } else if (xmlEntry) {
      ({ title, lang } = await parseXMLFile(path.join(dirPath, xmlEntry.name)));
    }
  } catch (err) {
    return handleError(err, file, retryCount, zip);
  }
  if (entries) { zip.close(); }


  return {
    file,
    title,
    lang,
    imageUrl,
    description,
    tags,
  };
};

const getZipEntries = (zip) => {
  return new Promise((resolve, reject) => {
    zip.on('ready', () => {
      resolve(Object.values(zip.entries()));
    });

    zip.on('error', reject);
  });
};

const handleZipError = (err, file, retryCount, zip) => {
  console.error(`Error processing file ${file}: ${err}`);

  // Close the zip file and retry or skip the file based on the retryCount
  zip.close();

  if (retryCount < 3) {
    console.error(`Retrying...`);
    return processFile(file, retryCount + 1);
  } else {
    console.error(`Skipping file after 3 attempts.`);
    return null; // Resolve with null to indicate that the file was skipped
  }
};

const extractAndParseJSON = (zip, jsonEntry, dirPath) => {
  return new Promise((resolve, reject) => {
    const jsonFilePath = path.join(dirPath, jsonEntry.name);

    // Extract the JSON file from the zip
    zip.extract(jsonEntry.name, jsonFilePath, err => {
      if (err) reject(err);

      // Read the extracted file
      fs.readFile(jsonFilePath, 'utf8', (err, jsonString) => {
        if (err) reject(err);

        try {
          // Parse the JSON string
          const jsonData = JSON.parse(jsonString);
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      });
    });
  });
};


const extractImage = (zip, imageEntry, dirPath, fileWithoutExt) => {
  return new Promise((resolve, reject) => {
    const imagePath = path.join(dirPath, imageEntry.name);
    zip.extract(imageEntry.name, imagePath, err => {
      if (err) reject(err);
      resolve(path.join('/thumbnails/', fileWithoutExt, imageEntry.name));
    });
  });
};

const extractAndParseXML = (zip, xmlEntry, dirPath) => {
  return new Promise((resolve, reject) => {
    // Define the file path where the XML file should be written
    const xmlFilePath = path.join(dirPath, xmlEntry.name);
    // Extract the XML file from the zip
    zip.extract(xmlEntry.name, xmlFilePath, err => {
      if (err) reject(err);
      // Read the extracted file
      fs.readFile(xmlFilePath, 'utf8', (err, xmlString) => {
        if (err) reject(err);
        // Parse the XML string
        xml2js.parseString(xmlString, (err, result) => {
          if (err) reject(err);
          try {
            const titleData = result.manifest.metadata[0]['imsmd:lom'][0]['imsmd:general'][0]['imsmd:title'][0]['imsmd:langstring'][0];
            const title = titleData._;
            const lang = titleData['$']['xml:lang'];
            resolve({ title, lang });
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });
};


const parseJSONFile = (jsonFilePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(jsonFilePath, 'utf8', (err, jsonString) => {
      if (err) reject(err);
      try {
        const jsonData = JSON.parse(jsonString);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    });
  });
};

const parseXMLFile = (xmlFilePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(xmlFilePath, 'utf8', (err, xmlString) => {
      if (err) reject(err);
      xml2js.parseString(xmlString, (err, result) => {
        if (err) reject(err);
        try {
          const titleData = result.manifest.metadata[0]['imsmd:lom'][0]['imsmd:general'][0]['imsmd:title'][0]['imsmd:langstring'][0];
          const title = titleData._;
          const lang = titleData['$']['xml:lang'];
          resolve({ title, lang });
        } catch (err) {
          reject(err);
        }
      });
    });
  });
};

const handleError = (err, file, retryCount, zip) => {
  console.error(`Error processing file ${file}: ${err}`);

  // Close the zip file and retry or skip the file based on the retryCount
  zip.close();

  if (retryCount < 3) {
    console.error(`Retrying...`);
    return processFile(file, retryCount + 1);
  } else {
    console.error(`Skipping file after 3 attempts.`);
    return null; // Resolve with null to indicate that the file was skipped
  }
};

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
    fs.mkdirSync(extractionPath, { recursive: true });

    fs.createReadStream(imsPackagePath)
      .pipe(unzipper.Extract({ path: extractionPath }))
      .on('close', () => {
        fs.readFile(
          path.join(extractionPath, "imsmanifest.xml"),
          "utf8",
          function(err, data) {
            if (err) {
              console.error(err);
              reject(err);
              return;
            }

            parser.parseString(data, function(err, result) {
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
      })
      .on('error', (err) => {
        console.error(err);
        reject(err);
      });
  });
};


module.exports = {
  checkForImsmanifest,
  flattenItems,
  escapeSpecialChars,
  getPackages,
  processItems,
  readPackage,
  checkIP,
  displayPI,
};  