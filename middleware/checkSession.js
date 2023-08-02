// Middleware to check for active session -- Not required anymore, keeping it just in case
module.exports = function checkSession(req, res, next) {
  // if (!req.session.manifests) {
  //   // Redirect to home page if there is no active session
  //   req.session.sessionEnded = true;
  //   return res.redirect("/");
  // }
  next();
}