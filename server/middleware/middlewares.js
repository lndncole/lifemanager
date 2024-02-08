// server/middleware/middlewares.js
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    } else {
      return res.status(401).send("Not Authenticated");
    }
  }
  module.exports = { isAuthenticated };