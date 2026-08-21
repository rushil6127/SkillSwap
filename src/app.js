/* ============================================
   SkillSwap — SPA Router & App Entry
   ============================================ */

import { renderLogin, initLogin } from './legacy-vite/pages/login.js';
import { renderRegister, initRegister } from './legacy-vite/pages/register.js';
import { renderProfileSetup, initProfileSetup } from './legacy-vite/pages/profileSetup.js';
import { renderProfile, initProfile } from './legacy-vite/pages/profile.js';
import { renderProfileEdit, initProfileEdit } from './legacy-vite/pages/profileEdit.js';
import { isLoggedIn, isProfileComplete } from './store.js';

const app = document.getElementById('app');

/* ── Route table ────────────────────────────── */
const routes = {
  login:        { render: renderLogin,        init: initLogin },
  register:     { render: renderRegister,      init: initRegister },
  setup:        { render: renderProfileSetup,  init: initProfileSetup },
  profile:      { render: renderProfile,       init: initProfile },
  'profile/edit': { render: renderProfileEdit, init: initProfileEdit },
};

/* ── Navigation helper (exported for pages) ── */
export function navigate(route) {
  window.location.hash = route;
}

/* ── Toast helper (exported for pages) ──────── */
export function showToast(message, type = 'success') {
  // Remove existing toast
  document.querySelector('.toast')?.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ── Celebration overlay (exported for setup) ── */
export function showCelebration(onComplete) {
  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  overlay.innerHTML = `
    <div class="glass-card celebration-card" style="max-width: 400px;">
      <div class="celebration-card__emoji">🎉</div>
      <div class="celebration-card__title">Welcome to SkillSwap!</div>
      <div class="celebration-card__subtitle">You've earned <strong>500 SkillCredits ◎</strong> to get started!</div>
      <button class="btn btn-primary btn-lg btn-full" id="celebration-continue">Let's Go!</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Spawn confetti
  spawnConfetti();

  document.getElementById('celebration-continue')?.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 300ms ease';
    setTimeout(() => {
      overlay.remove();
      // Remove confetti
      document.querySelectorAll('.confetti-piece').forEach(p => p.remove());
      if (onComplete) onComplete();
    }, 300);
  });
}

function spawnConfetti() {
  const colors = [
    'var(--clr-sage)', 'var(--clr-olive)', 'var(--clr-mint)',
    'var(--clr-tea)', 'var(--clr-mist)', 'var(--clr-cream)',
    '#7ec883', '#d4a843',
  ];
  const colorValues = [
    '#6B9071', '#98A77C', '#CFE1B9',
    '#AEC3B0', '#B6C99B', '#E3EED4',
    '#7ec883', '#d4a843',
  ];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colorValues[Math.floor(Math.random() * colorValues.length)];
    piece.style.width = (Math.random() * 8 + 6) + 'px';
    piece.style.height = (Math.random() * 8 + 6) + 'px';
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
  }
}

/* ── Router logic ───────────────────────────── */
function getRoute() {
  const hash = window.location.hash.replace('#', '') || '';
  return hash || null;
}

function resolveDefaultRoute() {
  if (!isLoggedIn()) return 'login';
  if (!isProfileComplete()) return 'setup';
  return 'profile';
}

function render() {
  let route = getRoute();

  // If no hash or unknown route, resolve default
  if (!route || !routes[route]) {
    route = resolveDefaultRoute();
    // Silently update hash without triggering another render
    history.replaceState(null, '', '#' + route);
  }

  // Auth guard: redirect unauthenticated users
  if (['setup', 'profile', 'profile/edit'].includes(route) && !isLoggedIn()) {
    route = 'login';
    history.replaceState(null, '', '#login');
  }

  const routeConfig = routes[route];
  if (!routeConfig) return;

  // Remove any existing page-nav before rendering
  document.querySelector('.page-nav')?.remove();

  const html = routeConfig.render();
  if (html !== undefined && html !== '') {
    app.innerHTML = html;
    // Initialize page event listeners after DOM is rendered
    requestAnimationFrame(() => {
      routeConfig.init();
    });
  }
}

/* ── Listen for hash changes ────────────────── */
window.addEventListener('hashchange', render);

/* ── Initial render ─────────────────────────── */
render();
