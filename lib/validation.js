const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
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

module.exports = { cleanString, validateRegistration };
