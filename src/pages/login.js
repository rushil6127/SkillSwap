/* ============================================
   SkillSwap — Login Page
   ============================================ */

import { loginUser, isLoggedIn, isProfileComplete } from '../store.js';
import { navigate } from '../app.js';

export function renderLogin() {
  // If already logged in, redirect
  if (isLoggedIn()) {
    navigate(isProfileComplete() ? 'profile' : 'setup');
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
        <h1 class="auth-title-light">Welcome back</h1>
        <p class="auth-subtitle-light">Enter your credentials to access your serene space</p>

        <form id="login-form" class="auth-form" novalidate>
          <div class="form-group" style="margin-bottom: 8px;">
            <label class="auth-label-light" for="login-email">Email Address</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">✉</span>
              <input
                id="login-email"
                class="auth-input-light"
                type="email"
                placeholder="hello@example.com"
                autocomplete="email"
                required
              />
            </div>
            <span class="form-error" id="login-email-error"></span>
          </div>

          <div class="form-group password-toggle" style="margin-bottom: 0;">
            <label class="auth-label-light" for="login-password">
              <span>Password</span>
              <a href="#" style="font-size: 0.75rem; font-weight: 600; text-decoration: none;">Forgot password?</a>
            </label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔒</span>
              <input
                id="login-password"
                class="auth-input-light"
                type="password"
                placeholder="••••••••••••"
                autocomplete="current-password"
                required
                style="padding-right: 48px;"
              />
              <button type="button" class="password-toggle__btn" id="login-toggle-pw" aria-label="Toggle password visibility" style="top: 50%; color: #1a2f23;">👁</button>
            </div>
            <span class="form-error" id="login-password-error"></span>
          </div>

          <div class="auth-checkbox-row">
            <input type="checkbox" id="login-remember" class="auth-checkbox" checked />
            <label for="login-remember" class="auth-checkbox-label">Remember me for 30 days</label>
          </div>

          <span class="form-error" id="login-general-error" style="text-align: center;"></span>

          <button type="submit" class="auth-btn-dark" id="login-submit">
            Log In
          </button>
        </form>

        <div class="auth-footer-light">
          Don't have an account? <a href="#register" id="login-register-link">Sign up free</a>
        </div>
      </div>
    </div>
  `;
}

export function initLogin() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const emailError = document.getElementById('login-email-error');
  const passwordError = document.getElementById('login-password-error');
  const generalError = document.getElementById('login-general-error');
  const togglePw = document.getElementById('login-toggle-pw');

  if (!form) return;

  // Toggle password visibility
  togglePw?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePw.textContent = isPassword ? '🙈' : '👁';
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Reset
    emailError.textContent = '';
    passwordError.textContent = '';
    generalError.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

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
    }

    if (!valid) return;

    const result = loginUser(email, password);

    if (!result.success) {
      generalError.textContent = result.error;
      return;
    }

    // Redirect based on profile state
    navigate(isProfileComplete() ? 'profile' : 'setup');
  });
}
