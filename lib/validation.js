const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 10;
const PASSWORD_MAX = 72; // bcrypt ignores anything past 72 bytes

// Turn any value into a trimmed string, so a missing field or an array never crashes us.
function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Check the register form. Returns a list of error messages (empty = all good).
function validateRegistration(email, password, confirmPassword) {
  const errors = [];

  if (email === '') {
    errors.push('Email is required.');
  } else if (email.length > EMAIL_MAX) {
    errors.push(`Email must be at most ${EMAIL_MAX} characters.`);
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  if (password.length < PASSWORD_MIN) {
    errors.push(`Password must be at least ${PASSWORD_MIN} characters.`);
  } else if (Buffer.byteLength(password) > PASSWORD_MAX) {
    errors.push(`Password must be at most ${PASSWORD_MAX} characters.`);
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return errors;
}

const NAME_MAX = 100;
const PHONE_MAX = 20;
const POLICY_MAX = 1000;
// Digits, spaces, dashes, dots, brackets and an optional + at the start.
const PHONE_PATTERN = /^\+?[0-9\s\-().]+$/;
// 24-hour time like 09:00 or 22:30 (what <input type="time"> sends).
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

// Turn the submitted restaurant form into the same shape we save in restaurants.json.
// Only the fields listed here are read, so anything extra the browser sends is ignored.
function readRestaurantForm(body) {
  const hours = {};
  DAYS.forEach((day) => {
    const closed = body[`${day.key}_closed`] === 'on';
    hours[day.key] = {
      open: closed ? '' : cleanString(body[`${day.key}_open`]),
      close: closed ? '' : cleanString(body[`${day.key}_close`]),
      closed,
    };
  });

  return {
    name: cleanString(body.name),
    phone: cleanString(body.phone),
    hours,
    policies: {
      reservation: cleanString(body.reservationPolicy),
      cancellation: cleanString(body.cancellationPolicy),
      other: cleanString(body.otherPolicy),
    },
  };
}

// Check the restaurant info form. Returns a list of error messages (empty = all good).
function validateRestaurantInfo(info) {
  const errors = [];

  if (info.name === '') {
    errors.push('Restaurant name is required.');
  } else if (info.name.length > NAME_MAX) {
    errors.push(`Restaurant name must be at most ${NAME_MAX} characters.`);
  }

  const digitCount = info.phone.replace(/\D/g, '').length;
  if (info.phone === '') {
    errors.push('Transfer phone number is required.');
  } else if (info.phone.length > PHONE_MAX || !PHONE_PATTERN.test(info.phone)
    || digitCount < 10 || digitCount > 15) {
    errors.push('Please enter a valid phone number, for example 514-555-1234.');
  }

  DAYS.forEach((day) => {
    const { open, close, closed } = info.hours[day.key];
    if (closed) {
      return;
    }
    if (!TIME_PATTERN.test(open) || !TIME_PATTERN.test(close)) {
      errors.push(`${day.label}: enter an opening and closing time, or check "Closed".`);
    } else if (close <= open) {
      // "HH:MM" strings compare correctly as text, e.g. "09:00" < "17:30".
      errors.push(`${day.label}: closing time must be after opening time.`);
    }
  });

  const policyNames = { reservation: 'Reservation', cancellation: 'Cancellation', other: 'Other' };
  Object.keys(policyNames).forEach((key) => {
    if (info.policies[key].length > POLICY_MAX) {
      errors.push(`${policyNames[key]} policy must be at most ${POLICY_MAX} characters.`);
    }
  });

  return errors;
}

const ITEM_NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const ALLERGENS_MAX = 300;
const PRICE_MAX = 10000;
// A whole number, or a number with 1 or 2 decimals: 12, 12.5, 12.50. No minus sign, so never below 0.
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

// Read the menu item form as plain strings, exactly as typed (so they can be shown again on errors).
function readMenuForm(body) {
  return {
    name: cleanString(body.name),
    price: cleanString(body.price),
    description: cleanString(body.description),
    allergens: cleanString(body.allergens),
  };
}

// Check the menu item form. Returns a list of error messages (empty = all good).
function validateMenuItem(values) {
  const errors = [];

  if (values.name === '') {
    errors.push('Item name is required.');
  } else if (values.name.length > ITEM_NAME_MAX) {
    errors.push(`Item name must be at most ${ITEM_NAME_MAX} characters.`);
  }

  if (values.price === '') {
    errors.push('Price is required.');
  } else if (!PRICE_PATTERN.test(values.price)) {
    errors.push('Price must be a number of 0 or more, with at most 2 decimals (for example 12.50).');
  } else if (Number(values.price) > PRICE_MAX) {
    errors.push(`Price must be at most ${PRICE_MAX}.`);
  }

  if (values.description.length > DESCRIPTION_MAX) {
    errors.push(`Description must be at most ${DESCRIPTION_MAX} characters.`);
  }

  if (values.allergens.length > ALLERGENS_MAX) {
    errors.push(`Allergens must be at most ${ALLERGENS_MAX} characters.`);
  }

  return errors;
}

// Turn checked form values into what we save: price as a number, allergens as a list.
// "nuts, Dairy ,, nuts" -> ["nuts", "Dairy"]
function toMenuItem(values) {
  const allergens = [];
  values.allergens.split(',').forEach((part) => {
    const allergen = part.trim();
    const alreadyListed = allergens.some((a) => a.toLowerCase() === allergen.toLowerCase());
    if (allergen !== '' && !alreadyListed) {
      allergens.push(allergen);
    }
  });

  return {
    name: values.name,
    price: Number(values.price),
    description: values.description,
    allergens,
  };
}

module.exports = {
  cleanString,
  validateRegistration,
  DAYS,
  readRestaurantForm,
  validateRestaurantInfo,
  readMenuForm,
  validateMenuItem,
  toMenuItem,
};
