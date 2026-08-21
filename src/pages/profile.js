/* ============================================
   SkillSwap — Profile View Page
   ============================================ */

import { getCurrentUser, isLoggedIn, isProfileComplete, logoutUser } from '../store.js';
import { navigate } from '../app.js';

function renderStars(rating, maxStars = 5) {
  let stars = '';
  const fullStars = Math.floor(rating);
  for (let i = 0; i < maxStars; i++) {
    stars += i < fullStars
      ? '<span class="star">★</span>'
      : '<span class="star star--empty">★</span>';
  }
  return stars;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function renderProfile() {
  if (!isLoggedIn()) { navigate('login'); return ''; }
  if (!isProfileComplete()) { navigate('setup'); return ''; }

  const user = getCurrentUser();
  if (!user) { navigate('login'); return ''; }

  const avatarContent = user.avatarUrl
    ? `<img src="${user.avatarUrl}" alt="${user.name}'s profile photo" />`
    : `<span class="avatar-placeholder">${getInitials(user.name)}</span>`;

  const skillChips = user.skills.map(s =>
    `<span class="skill-chip skill-chip--display">${s}</span>`
  ).join('');

  return `
    <nav class="page-nav">
      <a href="#profile" class="brand" style="text-decoration: none;">
        <span class="brand__icon" style="font-size: var(--fs-xl);">🔄</span>
        <span class="brand__name">SkillSwap</span>
      </a>
      <div class="page-nav__actions">
        <button class="btn btn-ghost" id="nav-logout">Logout</button>
      </div>
    </nav>

    <div class="profile-page fade-in" style="padding-top: 80px;">
      <div class="glass-card glass-card--profile stagger">
        <!-- Header -->
        <div class="profile-header fade-in">
          <div class="avatar avatar--xl">
            ${avatarContent}
          </div>
          <h1 class="profile-header__name">${user.name}</h1>
          <div class="profile-header__meta">
            <span>${user.department}</span>
            <span class="profile-header__meta-dot"></span>
            <span>${user.year}</span>
            <span class="profile-header__meta-dot"></span>
            <span>${user.college}</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="profile-stats fade-in">
          <div class="stat-card">
            <span class="stat-card__value">◎ ${user.creditsBalance}</span>
            <span class="stat-card__label">SkillCredits</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${user.rating > 0 ? user.rating.toFixed(1) : '—'}</span>
            <span class="stat-card__label">Rating</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">${user.completedSwaps}</span>
            <span class="stat-card__label">Swaps Completed</span>
          </div>
        </div>

        <!-- Rating Stars -->
        <div style="display: flex; justify-content: center; margin-bottom: var(--sp-6);" class="fade-in">
          <div class="rating">
            <div class="rating__stars">${renderStars(user.rating)}</div>
            <span class="rating__value">${user.rating > 0 ? `${user.rating.toFixed(1)} / 5.0` : 'No ratings yet'}</span>
          </div>
        </div>

        ${user.bio ? `
          <p class="profile-bio fade-in" style="margin-left: auto; margin-right: auto;">${user.bio}</p>
        ` : ''}

        <div class="divider"></div>

        <!-- Skills -->
        <div class="profile-section fade-in">
          <div class="profile-section__title">Skills</div>
          <div class="skill-chips">
            ${skillChips || '<span style="color: var(--clr-text-muted); font-size: var(--fs-sm);">No skills added yet.</span>'}
          </div>
        </div>

        <div class="divider"></div>

        <!-- Credit Balance Card -->
        <div style="display: flex; justify-content: center; margin-bottom: var(--sp-4);" class="fade-in">
          <div class="credit-badge credit-badge--lg credit-badge--glow">
            <span class="credit-badge__icon">◎</span>
            <div>
              <div class="credit-badge__amount">${user.creditsBalance}</div>
              <div class="credit-badge__label">SkillCredits Balance</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="profile-actions fade-in">
          <button class="btn btn-primary btn-lg" id="profile-edit-btn">
            ✏️ Edit Profile
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initProfile() {
  document.getElementById('profile-edit-btn')?.addEventListener('click', () => {
    navigate('profile/edit');
  });

  document.getElementById('nav-logout')?.addEventListener('click', () => {
    logoutUser();
    navigate('login');
  });
}
