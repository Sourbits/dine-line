const express = require('express');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../lib/jsonStore');
const {
  DAYS,
  readRestaurantForm,
  validateRestaurantInfo,
  readMenuForm,
  validateMenuItem,
  toMenuItem,
} = require('../lib/validation');
const { uniqueSlug } = require('../lib/slug');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

// Messages shown after a redirect, picked by ?saved=... in the URL.
// Only these fixed texts can appear, so nobody can put their own text on the page through the URL.
const SAVED_MESSAGES = {
  info: 'Your restaurant info was saved.',
  added: 'Menu item added.',
  updated: 'Menu item updated.',
  deleted: 'Menu item deleted.',
};

const NO_RESTAURANT_MESSAGE = 'Please fill in and save your restaurant info before adding menu items.';

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

// Show the dashboard. options can hold:
//   form          - values for the restaurant info form (default: the saved restaurant)
//   errors        - errors for the restaurant info form
//   savedMessage  - green message at the top
//   menuError     - { target: 'add' or an item id, errors, values } for a failed menu form
function renderDashboard(res, user, restaurant, options = {}) {
  res.render('dashboard', {
    email: user.email,
    days: DAYS,
    restaurant: restaurant || null,
    form: options.form || restaurant || emptyRestaurantForm(),
    errors: options.errors || [],
    savedMessage: options.savedMessage || '',
    menuError: options.menuError || null,
  });
}

// Find the logged-in user's restaurant. The browser never picks which one.
function findOwnRestaurant(restaurants, user) {
  const restaurant = restaurants.find((r) => r.ownerId === user.id);
  if (restaurant && !Array.isArray(restaurant.menu)) {
    restaurant.menu = []; // a hand-edited file might be missing the menu list
  }
  return restaurant;
}

router.get('/dashboard', (req, res) => {
  const user = findSessionUser(req, res);
  if (!user) {
    return;
  }

  const restaurant = findOwnRestaurant(readJSON('restaurants.json'), user);
  renderDashboard(res, user, restaurant, {
    savedMessage: SAVED_MESSAGES[req.query.saved] || '',
  });
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
  const restaurant = findOwnRestaurant(restaurants, user);

  if (errors.length > 0) {
    // Show the form again with what the user typed.
    info.slug = restaurant ? restaurant.slug : '';
    res.status(400);
    return renderDashboard(res, user, restaurant, { form: info, errors });
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
    res.status(500);
    return renderDashboard(res, user, restaurant, {
      form: info,
      errors: ['Something went wrong while saving. Please try again.'],
    });
  }

  // Redirect after saving so refreshing the page doesn't submit the form again.
  res.redirect('/dashboard?saved=info');
});

// Save the restaurants file. On failure, show the error under the menu form that was used.
function saveMenu(res, user, restaurants, restaurant, target, values, savedKey) {
  try {
    writeJSON('restaurants.json', restaurants);
  } catch (err) {
    console.error('Could not save menu:', err.message);
    res.status(500);
    return renderDashboard(res, user, restaurant, {
      menuError: { target, values, errors: ['Something went wrong while saving. Please try again.'] },
    });
  }
  res.redirect(`/dashboard?saved=${savedKey}#menu`);
}

// Add a menu item to the logged-in user's restaurant.
router.post('/dashboard/menu', (req, res) => {
  const user = findSessionUser(req, res);
  if (!user) {
    return;
  }

  const restaurants = readJSON('restaurants.json');
  const restaurant = findOwnRestaurant(restaurants, user);
  const values = readMenuForm(req.body);

  if (!restaurant) {
    res.status(400);
    return renderDashboard(res, user, null, {
      menuError: { target: 'add', values, errors: [NO_RESTAURANT_MESSAGE] },
    });
  }

  const errors = validateMenuItem(values);
  if (errors.length > 0) {
    res.status(400);
    return renderDashboard(res, user, restaurant, { menuError: { target: 'add', values, errors } });
  }

  restaurant.menu.push({ id: crypto.randomUUID(), ...toMenuItem(values) });
  saveMenu(res, user, restaurants, restaurant, 'add', values, 'added');
});

// Find a menu item by the :id in the URL, but ONLY inside the logged-in user's restaurant.
// Returns null if this user has no restaurant or the id isn't in their menu.
function findOwnMenuItem(restaurant, itemId) {
  if (!restaurant) {
    return null;
  }
  return restaurant.menu.find((item) => item.id === itemId) || null;
}

function renderNotFound(res) {
  res.status(404).render('404', { message: 'That menu item was not found.' });
}

// Edit one of the logged-in user's menu items.
router.post('/dashboard/menu/:id/edit', (req, res) => {
  const user = findSessionUser(req, res);
  if (!user) {
    return;
  }

  const restaurants = readJSON('restaurants.json');
  const restaurant = findOwnRestaurant(restaurants, user);
  const item = findOwnMenuItem(restaurant, req.params.id);
  if (!item) {
    return renderNotFound(res);
  }

  const values = readMenuForm(req.body);
  const errors = validateMenuItem(values);
  if (errors.length > 0) {
    res.status(400);
    return renderDashboard(res, user, restaurant, { menuError: { target: item.id, values, errors } });
  }

  // Change the item's fields but keep its id.
  Object.assign(item, toMenuItem(values));
  saveMenu(res, user, restaurants, restaurant, item.id, values, 'updated');
});

// Delete one of the logged-in user's menu items.
router.post('/dashboard/menu/:id/delete', (req, res) => {
  const user = findSessionUser(req, res);
  if (!user) {
    return;
  }

  const restaurants = readJSON('restaurants.json');
  const restaurant = findOwnRestaurant(restaurants, user);
  const item = findOwnMenuItem(restaurant, req.params.id);
  if (!item) {
    return renderNotFound(res);
  }

  restaurant.menu = restaurant.menu.filter((i) => i.id !== item.id);
  saveMenu(res, user, restaurants, restaurant, item.id, null, 'deleted');
});

module.exports = router;
