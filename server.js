const express = require("express");
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const rateLimit = require("express-rate-limit");

// const helmet = require('helmet');
const ejs = require("ejs"); // required for templates
//Todo: require("matomo-tracker")
const os = require('os');
const path = require("path");
const fs = require("fs");
const {
  getPackages,
  displayPI,
} = require("./utils.js");
const { router: resourceRoutes } = require('./routes/resource');
const pageRoutes = require('./routes/page');
const d2lRoutes = require('./routes/d2l');
const app = express();
const serverFiles = "./server-files/"
const sessionPath = `${serverFiles}/session-data`;

if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
}

// Throw an error and stop the server if SECRET is not defined
if (!process.env.SECRET) {
  throw new Error('SECRET environment variable is not defined. The server cannot start without it.');
}

app.use(
  session({
    store: new FileStore({
      path: sessionPath,
      ttl: 2592000, // One month in seconds
      retries: 5,
      fileExtension: '.json',
      // secret: process.env.SECRET,
      encrypt: false,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: true }, // added security flags
  })
);

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 2400, // limit each IP to 2400 requests per windowMs
  message: "<h1>Too many requests from this IP, please try again after 2 minutes.</h1> <hr> <h1>Trop de requêtes venant de cette adresse IP, veuillez essayer de nouveau dans 2 minutes.</h1>",
  keyGenerator: (req) => {
    return req.app.get('trust proxy') ? req.headers['x-forwarded-for'] || req.ip : req.connection.remoteAddress;
  },
});

app.set("view engine", "ejs");
app.set("trust proxy", true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('*.(jpg|jpeg|png|gif)', function(req, res, next) {
  // set Cache-Control for these specific types
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // one month
  next(); // pass control to the next handler
});
// Disabled Helmet because the content policy was too strict.
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     defaultSrc: ["'self'"],
//     scriptSrc: ["'self'", "'unsafe-inline'","https://video.csps-efpc.gc.ca"],
//     styleSrc: ["'self'", "'unsafe-inline'","https://fonts.googleapis.com"],
//     imgSrc: ["'self'", "data:"],
//     childSrc: ["'self'"],
//     formAction: ["'self'"],
//     connectSrc: ["'none'"],
//     fontSrc: ["'self'","https://fonts.gstatic.com"],
//   }
// }));
app.use(limiter);
require("./routes/admin.js")(app);
app.get("/", async (req, res) => {
  res.set('Vary', 'Accept-Language');
  const displayPIsymbol = displayPI(req); // Check if authorized IP to display link to /adminconsole
  // Check if sessionEnded flag is set
  const sessionEnded = req.session.sessionEnded;
  // Remove the flag from the session
  req.session.sessionEnded = null;
  // index page, lists the files
  try {
    const packageFiles = await getPackages(); // Read all zip files and return an array of courses
    const sessionLanguage = req.session.language || 'en-ca'; // Default to 'en-ca' if no language is set in the session
    res.render("index", { packageFiles, sessionEnded, sessionLanguage, displayPIsymbol });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error reading packages");
  }
});
app.post('/setLanguage', (req, res) => {
  const newLang = req.body.language;
  req.session.language = newLang;
  res.sendStatus(200);
});
app.get('/getLanguage', function(req, res) {
  if (req.session && req.session.language) {
    res.json({ language: req.session.language });
  } else {
    res.json({ language: null });
  }
});
app.use("/load", require("./routes/load.js")); // Route that serves the zip package and creates the session
app.use("/shared", express.static("shared")); // Path for D2L shared files
app.use("/public", express.static("public")); // General shared path for the app
app.use('/thumbnails', express.static(path.join(serverFiles, 'thumbnails')));
app.get("/content/enforced/*/*", (req, res) => {
  // The wildcard '*' in the route path will match any string
  // The 'req.params[0]' will return the first matched string (course code in this case)
  // The 'req.params[1]' will return the second matched string (file-or-path in this case)
  const redirectedPath = `/page/${req.params[1]}`;
  res.redirect(redirectedPath);
});
app.use("/d2l", d2lRoutes); // Is used to catch D2L internal links
app.use('/resource', resourceRoutes); // Main course navigation engine
app.use("/page", pageRoutes); // Display course pages and/or files

app.use(function(err, req, res, next) {
  // Log the error as this middleware catches errors
  console.error(err);

  if (err.code === 'ENOENT') {
    // File not found
    // check if the path for the requested package is found, if not, end session.
    if (req.session.currentBasePath && !fs.existsSync(req.session.currentBasePath)) {
      req.session.destroy(function(err) {
        // Handle error if there is one
        if (err) {
          console.error("Failed to destroy session:", err);
        }
        res.status(404).render("404", { title: "Page Not Found - Page introuvable" });
      });
    }
        res.status(404).render("404", { title: "Page Not Found - Page introuvable" });
  } else {
    // General server error
    const sessionLanguage = req.session.language || 'en-ca'; // Default to 'en-ca' if no language is set in the session
    let title;
    let message;
    let homeLinkText;

    if (sessionLanguage === 'fr-ca') {
      title = 'Erreur du Serveur';
      message = 'Une erreur s\'est produite sur le serveur. Veuillez réessayer plus tard.';
      homeLinkText = 'Retour à la page d\'accueil';
    } else {
      title = 'Server Error';
      message = 'A server error has occurred. Please try again later.';
      homeLinkText = 'Return to homepage';
    }
    res.status(500).render('server-error', {
      title,
      message,
      homeLinkText
    });
  }
});

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
