const express = require('express');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../lib/jsonStore');
const { DAYS, readRestaurantForm, validateRestaurantInfo } = require('../lib/validation');
const { uniqueSlug } = require('../lib/slug');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

// Every route in this file needs a logged-in user.
router.use('/dashboard', requireLogin);

// Find the logged-in user with the id from the session, never one sent by the browser.
// If that user no longer exists, log them out and return null.
function findSessionUser(req, res) {
  const users = readJSON('users.json');
  const user = users.find((u) => u.id === req.session.userId);
  if (!user) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
    return null;
  }
  return user;
}

// An empty form for users who haven't saved their restaurant yet.
function emptyRestaurantForm() {
  const hours = {};
  DAYS.forEach((day) => {
    hours[day.key] = { open: '', close: '', closed: false };
  });
  return {
    name: '',
    phone: '',
    slug: '',
    hours,
    policies: { reservation: '', cancellation: '', other: '' },
  };
}

function renderDashboard(res, user, form, errors, saved) {
  res.render('dashboard', { email: user.email, form, errors, saved, days: DAYS });
}

router.get('/dashboard', (req, res) => {
  const user = findSessionUser(req, res);
  if (!user) {
    return;
  }

  const restaurants = readJSON('restaurants.json');
  const restaurant = restaurants.find((r) => r.ownerId === user.id);

  renderDashboard(res, user, restaurant || emptyRestaurantForm(), [], req.query.saved === '1');
});

// Create or update the logged-in user's restaurant info.
router.post('/dashboard/info', (req, res) => {
  const user = findSessionUser(req, res);
  if (!user) {
    return;
  }

  const info = readRestaurantForm(req.body);
  const errors = validateRestaurantInfo(info);

  const restaurants = readJSON('restaurants.json');
  // The restaurant is found by its owner, the logged-in user. The browser never picks which one.
  const restaurant = restaurants.find((r) => r.ownerId === user.id);

  if (errors.length > 0) {
    // Show the form again with what the user typed.
    info.slug = restaurant ? restaurant.slug : '';
    return res.status(400).render('dashboard', {
      email: user.email, form: info, errors, saved: false, days: DAYS,
    });
  }

  if (restaurant) {
    // Only make a new slug if the name changed, so the public link stays the same otherwise.
    if (restaurant.name !== info.name) {
      restaurant.slug = uniqueSlug(info.name, restaurants, restaurant.id);
    }
    restaurant.name = info.name;
    restaurant.phone = info.phone;
    restaurant.hours = info.hours;
    restaurant.policies = info.policies;
  } else {
    const id = crypto.randomUUID();
    restaurants.push({
      id,
      ownerId: user.id,
      name: info.name,
      slug: uniqueSlug(info.name, restaurants, id),
      phone: info.phone,
      hours: info.hours,
      policies: info.policies,
      menu: [],
    });
  }

  try {
    writeJSON('restaurants.json', restaurants);
  } catch (err) {
    console.error('Could not save restaurant:', err.message);
    info.slug = restaurant ? restaurant.slug : '';
    return res.status(500).render('dashboard', {
      email: user.email,
      form: info,
      errors: ['Something went wrong while saving. Please try again.'],
      saved: false,
      days: DAYS,
    });
  }

  // Redirect after saving so refreshing the page doesn't submit the form again.
  res.redirect('/dashboard?saved=1');
});

module.exports = router;
