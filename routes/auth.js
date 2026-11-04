const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../lib/jsonStore');
const { cleanString, validateRegistration } = require('../lib/validation');

const router = express.Router();
const SALT_ROUNDS = 10;

// Show the empty register form.
router.get('/register', (req, res) => {
  res.render('register', { errors: [], email: '', success: false });
});

// Handle the submitted register form.
router.post('/register', async (req, res) => {
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
    return res.status(400).render('register', { errors, email, success: false });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    users.push({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    writeJSON('users.json', users);
  } catch (err) {
    console.error('Could not save new user:', err.message);
    return res.status(500).render('register', {
      errors: ['Something went wrong. Please try again.'],
      email,
      success: false,
    });
  }

  // Login isn't built yet, so for now just confirm the account was created.
  res.render('register', { errors: [], email: '', success: true });
});

module.exports = router;
