// Only let logged-in users through. Everyone else is sent to the login page.
function requireLogin(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

module.exports = requireLogin;
