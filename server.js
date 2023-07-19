const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
// const helmet = require('helmet');
const ejs = require("ejs"); // required for templates
//Todo: require("matomo-tracker")
const path = require("path");
const {
  getPackages,
  displayPI,
} = require("./utils.js");
const resourceRoutes = require('./routes/resource');
const pageRoutes = require('./routes/page');
const d2lRoutes = require('./routes/d2l');
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
  max: 2400, // limit each IP to 2400 requests per windowMs
  message: "<h1>Too many requests from this IP, please try again after 2 minutes.</h1> <hr> <h1>Trop de requêtes venant de cette adresse IP, veuillez essayer de nouveau dans 2 minutes.</h1>",
});

app.set("view engine", "ejs");
app.set("trust proxy", true);
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
  const displayPIsymbol = displayPI(req); // Check if authorized IP to display link to /adminconsole
  const sessionLanguage = req.session.language || 'en-ca'; // Default to 'en' if no language is set in the session
  // Check if sessionEnded flag is set
  const sessionEnded = req.session.sessionEnded;
  // Remove the flag from the session
  req.session.sessionEnded = null;
  // index page, lists the files
  try {
    const packageFiles = await getPackages(); // Read all zip files and return an array of courses
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
app.use("/load", require("./routes/load.js")); // Route that serves the zip package and creates the session
app.use("/shared", express.static("shared")); // Path for D2L shared files
app.use("/public", express.static("public")); // General shared path for the app
app.use('/thumbnails', express.static(path.join(__dirname, 'tmp')));
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
