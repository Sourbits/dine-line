// Live checks for the register form. This only helps the user:
// the server still validates everything (see lib/validation.js).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 10;

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');

const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmPasswordError');

// Show a message under an input, or clear it if the message is ''.
function showError(input, errorElement, message) {
  errorElement.textContent = message;
  input.classList.toggle('invalid', message !== '');
}

// In each check, an empty field shows no error: the user hasn't typed anything yet.
function checkEmail() {
  const value = emailInput.value.trim();
  const message = value !== '' && !EMAIL_PATTERN.test(value)
    ? 'Please enter a valid email address.'
    : '';
  showError(emailInput, emailError, message);
}

function checkPassword() {
  const value = passwordInput.value;
  const message = value !== '' && value.length < PASSWORD_MIN
    ? `Password must be at least ${PASSWORD_MIN} characters.`
    : '';
  showError(passwordInput, passwordError, message);
}

function checkConfirm() {
  const value = confirmInput.value;
  const message = value !== '' && value !== passwordInput.value
    ? 'Passwords do not match.'
    : '';
  showError(confirmInput, confirmError, message);
}

emailInput.addEventListener('input', checkEmail);
passwordInput.addEventListener('input', () => {
  checkPassword();
  checkConfirm(); // changing the password can make the two match, or stop matching
});
confirmInput.addEventListener('input', checkConfirm);
