// server/middleware/middlewares.js
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else if(req.query && req.query.password) {
    if (req.query.password === process.env.QUERY_STRING_PASSWORD) { 
      return next(); 
    }
  } else {
    return res.status(401).send("Not Authenticated");
  }
}
module.exports = { isAuthenticated };