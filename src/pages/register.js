/* ============================================
   SkillSwap — Register Page
   ============================================ */

import { registerUser, isLoggedIn } from '../store.js';
import { navigate } from '../app.js';

export function renderRegister() {
  if (isLoggedIn()) {
    navigate('setup');
    return '';
  }

  return `
    <div class="auth-page fade-in">
      <!-- Decorative background elements -->
      <div class="bg-shape shape-star shape-star-1">✦</div>
      <div class="bg-shape shape-star shape-star-2">✦</div>
      <div class="bg-shape shape-star shape-star-3">✦</div>
      <div class="bg-shape shape-circle shape-circle-1"></div>
      <div class="bg-shape shape-circle shape-circle-2"></div>
      <div class="bg-shape shape-dots"></div>

      <div class="glass-card--light fade-in">
        <div class="auth-icon-top">🍃</div>
        <h1 class="auth-title-light">Create Account</h1>
        <p class="auth-subtitle-light">Join the campus skill exchange community</p>

        <form id="register-form" class="auth-form" novalidate>
          <div class="form-group" style="margin-bottom: 8px;">
            <label class="auth-label-light" for="register-email">Email Address</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">✉</span>
              <input
                id="register-email"
                class="auth-input-light"
                type="email"
                placeholder="you@campus.edu"
                autocomplete="email"
                required
              />
            </div>
            <span class="form-error" id="register-email-error"></span>
          </div>

          <div class="form-group password-toggle" style="margin-bottom: 8px;">
            <label class="auth-label-light" for="register-password">Password</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔒</span>
              <input
                id="register-password"
                class="auth-input-light"
                type="password"
                placeholder="At least 6 characters"
                autocomplete="new-password"
                required
                style="padding-right: 48px;"
              />
              <button type="button" class="password-toggle__btn" id="register-toggle-pw" aria-label="Toggle password visibility" style="top: 50%; color: #1a2f23;">👁</button>
            </div>
            <span class="form-error" id="register-password-error"></span>
          </div>

          <div class="form-group password-toggle" style="margin-bottom: 0;">
            <label class="auth-label-light" for="register-confirm">Confirm Password</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔒</span>
              <input
                id="register-confirm"
                class="auth-input-light"
                type="password"
                placeholder="Re-enter your password"
                autocomplete="new-password"
                required
                style="padding-right: 48px;"
              />
              <button type="button" class="password-toggle__btn" id="register-toggle-confirm" aria-label="Toggle password visibility" style="top: 50%; color: #1a2f23;">👁</button>
            </div>
            <span class="form-error" id="register-confirm-error"></span>
          </div>

          <span class="form-error" id="register-general-error" style="text-align: center; margin-top: 16px;"></span>

          <button type="submit" class="auth-btn-dark" id="register-submit">
            Sign Up
          </button>
        </form>

        <div class="auth-footer-light">
          Already have an account? <a href="#login" id="register-login-link">Sign in</a>
        </div>
      </div>
    </div>
  `;
}

export function initRegister() {
  const form = document.getElementById('register-form');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const confirmInput = document.getElementById('register-confirm');
  const emailError = document.getElementById('register-email-error');
  const passwordError = document.getElementById('register-password-error');
  const confirmError = document.getElementById('register-confirm-error');
  const generalError = document.getElementById('register-general-error');
  const togglePw = document.getElementById('register-toggle-pw');
  const toggleConfirm = document.getElementById('register-toggle-confirm');

  if (!form) return;

  // Toggle password visibility
  togglePw?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePw.textContent = isPassword ? '🙈' : '👁';
  });

  toggleConfirm?.addEventListener('click', () => {
    const isPassword = confirmInput.type === 'password';
    confirmInput.type = isPassword ? 'text' : 'password';
    toggleConfirm.textContent = isPassword ? '🙈' : '👁';
  });

  // Clear errors on input
  emailInput?.addEventListener('input', () => {
    emailError.textContent = '';
    emailInput.classList.remove('form-input--error');
  });
  passwordInput?.addEventListener('input', () => {
    passwordError.textContent = '';
    passwordInput.classList.remove('form-input--error');
  });
  confirmInput?.addEventListener('input', () => {
    confirmError.textContent = '';
    confirmInput.classList.remove('form-input--error');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Reset
    emailError.textContent = '';
    passwordError.textContent = '';
    confirmError.textContent = '';
    generalError.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!email) {
      emailError.textContent = 'Email is required.';
      emailInput.classList.add('form-input--error');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Enter a valid email address.';
      emailInput.classList.add('form-input--error');
      valid = false;
    }

    if (!password) {
      passwordError.textContent = 'Password is required.';
      passwordInput.classList.add('form-input--error');
      valid = false;
    } else if (password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters.';
      passwordInput.classList.add('form-input--error');
      valid = false;
    }

    if (!confirm) {
      confirmError.textContent = 'Please confirm your password.';
      confirmInput.classList.add('form-input--error');
      valid = false;
    } else if (password !== confirm) {
      confirmError.textContent = 'Passwords do not match.';
      confirmInput.classList.add('form-input--error');
      valid = false;
    }

    if (!valid) return;

    const result = registerUser(email, password);

    if (!result.success) {
      generalError.textContent = result.error;
      return;
    }

    // Redirect to profile setup
    navigate('setup');
  });
}
