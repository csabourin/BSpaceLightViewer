// Middleware to check for active session
module.exports = function checkSession(req, res, next) {
  if (!req.session.manifests) {
    // Redirect to home page if there is no active session
    req.session.sessionEnded = true;
    return res.redirect("/");
  }
  next();
}