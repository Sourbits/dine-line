// Logged-in users don't need the login or register pages, so send them to the dashboard.
function redirectIfLoggedIn(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = redirectIfLoggedIn;
