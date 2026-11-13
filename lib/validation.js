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

module.exports = {
  cleanString,
  validateRegistration,
  DAYS,
  readRestaurantForm,
  validateRestaurantInfo,
};
