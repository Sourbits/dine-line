const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../lib/jsonStore');
const { cleanString, validateRegistration } = require('../lib/validation');
const redirectIfLoggedIn = require('../middleware/redirectIfLoggedIn');

const router = express.Router();
const SALT_ROUNDS = 10;
const LOGIN_ERROR = 'Invalid email or password.';

// Start a fresh session for this user and remember who they are.
// regenerate() gives the browser a brand-new session id, so an id someone
// got hold of before login is useless afterwards.
function logIn(req, userId, callback) {
  req.session.regenerate((err) => {
    if (err) {
      return callback(err);
    }
    req.session.userId = userId;
    req.session.save(callback);
  });
}

// Show the empty register form.
router.get('/register', redirectIfLoggedIn, (req, res) => {
  res.render('register', { errors: [], email: '' });
});

// Handle the submitted register form.
router.post('/register', redirectIfLoggedIn, async (req, res) => {
  const email = cleanString(req.body.email).toLowerCase();
  // Passwords are not trimmed: spaces can be part of a password.
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

  const errors = validateRegistration(email, password, confirmPassword);

  const users = readJSON('users.json');
  if (errors.length === 0 && users.some((user) => user.email === email)) {
    errors.push('An account with this email already exists.');
  }

  if (errors.length > 0) {
    // Show the form again with the errors. Keep the email, never send the password back.
    return res.status(400).render('register', { errors, email });
  }

  const newUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash: '',
    createdAt: new Date().toISOString(),
  };

  try {
    newUser.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    users.push(newUser);
    writeJSON('users.json', users);
  } catch (err) {
    console.error('Could not save new user:', err.message);
    return res.status(500).render('register', {
      errors: ['Something went wrong. Please try again.'],
      email,
    });
  }

  logIn(req, newUser.id, (err) => {
    if (err) {
      // The account exists, so send them to log in by hand.
      console.error('Could not start session:', err.message);
      return res.redirect('/login');
    }
    res.redirect('/dashboard');
  });
});

// Show the empty login form.
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('login', { error: '', email: '' });
});

// Check the email and password, then log the user in.
router.post('/login', redirectIfLoggedIn, async (req, res) => {
  const email = cleanString(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  const users = readJSON('users.json');
  const user = users.find((u) => u.email === email);

  // Same message whether the email or the password is wrong,
  // so nobody can use this form to find out which emails have accounts.
  let passwordOk = false;
  try {
    if (user && password !== '') {
      passwordOk = await bcrypt.compare(password, user.passwordHash);
    }
  } catch (err) {
    console.error('Could not check password:', err.message);
  }

  if (!passwordOk) {
    return res.status(401).render('login', { error: LOGIN_ERROR, email });
  }

  logIn(req, user.id, (err) => {
    if (err) {
      console.error('Could not start session:', err.message);
      return res.status(500).render('login', { error: 'Something went wrong. Please try again.', email });
    }
    res.redirect('/dashboard');
  });
});

// Log out: delete the session on the server and the cookie in the browser.
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Could not end session:', err.message);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
