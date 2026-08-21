/* ============================================
   SkillSwap — Profile Setup Page (First-Time)
   ============================================ */

import { completeProfileSetup, getCurrentUser, isLoggedIn, isProfileComplete } from '../store.js';
import { navigate, showCelebration } from '../app.js';
import { SKILL_CATEGORIES } from '../data/skills.js';

export function renderProfileSetup() {
  if (!isLoggedIn()) { navigate('login'); return ''; }
  if (isProfileComplete()) { navigate('profile'); return ''; }

  const skillChipsHTML = SKILL_CATEGORIES.map(cat => `
    <div class="skill-category">
      <div class="skill-category__title">${cat.name}</div>
      <div class="skill-chips">
        ${cat.skills.map(skill => `
          <button type="button" class="skill-chip" data-skill="${skill}">${skill}</button>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="setup-page fade-in">
      <div class="brand">
        <span class="brand__icon">🔄</span>
        <span class="brand__name">SkillSwap</span>
      </div>

      <div class="glass-card glass-card--profile">
        <div class="setup-header">
          <h1 class="setup-header__title">Complete your profile</h1>
          <p class="setup-header__subtitle">Tell us about yourself so other students can find and connect with you.</p>
        </div>

        <form id="setup-form" class="setup-form" novalidate>
          <!-- Avatar -->
          <div class="setup-avatar-section">
            <div class="avatar avatar--xl avatar-upload" id="setup-avatar-container">
              <span class="avatar-placeholder" id="setup-avatar-placeholder">📷</span>
              <img id="setup-avatar-preview" src="" alt="Profile photo" style="display: none;" />
              <div class="avatar-upload-overlay">Change</div>
            </div>
            <input type="file" id="setup-avatar-input" accept="image/*" hidden />
            <button type="button" class="btn btn-ghost" id="setup-avatar-btn">Upload Photo</button>
          </div>

          <!-- Name -->
          <div class="form-group">
            <label class="form-label" for="setup-name">Full Name *</label>
            <input id="setup-name" class="form-input" type="text" placeholder="Your full name" required />
            <span class="form-error" id="setup-name-error"></span>
          </div>

          <!-- College & Department -->
          <div class="setup-row">
            <div class="form-group">
              <label class="form-label" for="setup-college">College *</label>
              <input id="setup-college" class="form-input" type="text" placeholder="e.g. MIT, IIT Delhi" required />
              <span class="form-error" id="setup-college-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="setup-department">Department *</label>
              <input id="setup-department" class="form-input" type="text" placeholder="e.g. Computer Science" required />
              <span class="form-error" id="setup-department-error"></span>
            </div>
          </div>

          <!-- Year -->
          <div class="form-group">
            <label class="form-label" for="setup-year">Year *</label>
            <select id="setup-year" class="form-input form-select" required>
              <option value="" disabled selected>Select your year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="PG">Postgraduate</option>
            </select>
            <span class="form-error" id="setup-year-error"></span>
          </div>

          <!-- Skills -->
          <div class="setup-skills-section">
            <div class="form-group">
              <label class="form-label">Your Skills * <span style="font-weight: var(--fw-regular); color: var(--clr-text-muted);">(select at least 1)</span></label>
              <span class="form-error" id="setup-skills-error"></span>
            </div>
            ${skillChipsHTML}
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label class="form-label" for="setup-bio">Bio <span style="font-weight: var(--fw-regular); color: var(--clr-text-muted);">(optional)</span></label>
            <textarea id="setup-bio" class="form-input" placeholder="Tell other students about yourself, your interests, and what you're looking for..."></textarea>
          </div>

          <span class="form-error" id="setup-general-error" style="text-align: center;"></span>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="setup-submit">
            Complete Profile & Earn 500 SkillCredits ◎
          </button>
        </form>
      </div>
    </div>
  `;
}

export function initProfileSetup() {
  const form = document.getElementById('setup-form');
  if (!form) return;

  const nameInput = document.getElementById('setup-name');
  const collegeInput = document.getElementById('setup-college');
  const departmentInput = document.getElementById('setup-department');
  const yearInput = document.getElementById('setup-year');
  const bioInput = document.getElementById('setup-bio');
  const avatarInput = document.getElementById('setup-avatar-input');
  const avatarBtn = document.getElementById('setup-avatar-btn');
  const avatarContainer = document.getElementById('setup-avatar-container');
  const avatarPreview = document.getElementById('setup-avatar-preview');
  const avatarPlaceholder = document.getElementById('setup-avatar-placeholder');

  let selectedSkills = new Set();
  let avatarDataUrl = '';

  // Avatar upload
  const triggerUpload = () => avatarInput.click();
  avatarBtn?.addEventListener('click', triggerUpload);
  avatarContainer?.addEventListener('click', triggerUpload);

  avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      avatarDataUrl = ev.target.result;
      avatarPreview.src = avatarDataUrl;
      avatarPreview.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // Skill chip toggling
  document.querySelectorAll('#setup-form .skill-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const skill = chip.dataset.skill;
      if (selectedSkills.has(skill)) {
        selectedSkills.delete(skill);
        chip.classList.remove('skill-chip--selected');
      } else {
        selectedSkills.add(skill);
        chip.classList.add('skill-chip--selected');
      }
      // Clear skills error
      document.getElementById('setup-skills-error').textContent = '';
    });
  });

  // Clear errors on input
  [nameInput, collegeInput, departmentInput].forEach(input => {
    input?.addEventListener('input', () => {
      const errorEl = document.getElementById(`setup-${input.id.split('-')[1]}-error`);
      if (errorEl) errorEl.textContent = '';
      input.classList.remove('form-input--error');
    });
  });

  yearInput?.addEventListener('change', () => {
    document.getElementById('setup-year-error').textContent = '';
    yearInput.classList.remove('form-input--error');
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { input: nameInput, errorId: 'setup-name-error', label: 'Name' },
      { input: collegeInput, errorId: 'setup-college-error', label: 'College' },
      { input: departmentInput, errorId: 'setup-department-error', label: 'Department' },
    ];

    fields.forEach(({ input, errorId, label }) => {
      const errorEl = document.getElementById(errorId);
      if (!input.value.trim()) {
        errorEl.textContent = `${label} is required.`;
        input.classList.add('form-input--error');
        valid = false;
      } else {
        errorEl.textContent = '';
      }
    });

    if (!yearInput.value) {
      document.getElementById('setup-year-error').textContent = 'Please select your year.';
      yearInput.classList.add('form-input--error');
      valid = false;
    }

    if (selectedSkills.size === 0) {
      document.getElementById('setup-skills-error').textContent = 'Please select at least one skill.';
      valid = false;
    }

    if (!valid) return;

    const result = completeProfileSetup({
      name: nameInput.value.trim(),
      college: collegeInput.value.trim(),
      department: departmentInput.value.trim(),
      year: yearInput.value,
      skills: Array.from(selectedSkills),
      bio: bioInput.value.trim(),
      avatarUrl: avatarDataUrl,
    });

    if (!result.success) {
      document.getElementById('setup-general-error').textContent = result.error;
      return;
    }

    // Show celebration, then redirect
    showCelebration(() => navigate('profile'));
  });
}
