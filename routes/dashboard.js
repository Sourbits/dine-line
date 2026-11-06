const express = require('express');
const { readJSON } = require('../lib/jsonStore');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

router.get('/dashboard', requireLogin, (req, res) => {
  // Always look the user up with the id from the session, never one sent by the browser.
  const users = readJSON('users.json');
  const user = users.find((u) => u.id === req.session.userId);

  if (!user) {
    // The session points to a user that no longer exists: log them out.
    return req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  }

  res.render('dashboard', { email: user.email });
});

module.exports = router;
