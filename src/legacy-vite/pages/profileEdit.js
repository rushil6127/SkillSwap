/* ============================================
   SkillSwap — Profile Edit Page
   ============================================ */

import { getCurrentUser, updateProfile, isLoggedIn, isProfileComplete } from '../../store.js';
import { navigate, showToast } from '../../app.js';
import { SKILL_CATEGORIES } from '../../data/skills.js';

export function renderProfileEdit() {
  if (!isLoggedIn()) { navigate('login'); return ''; }
  if (!isProfileComplete()) { navigate('setup'); return ''; }

  const user = getCurrentUser();
  if (!user) { navigate('login'); return ''; }

  const skillChipsHTML = SKILL_CATEGORIES.map(cat => `
    <div class="skill-category">
      <div class="skill-category__title">${cat.name}</div>
      <div class="skill-chips">
        ${cat.skills.map(skill => `
          <button type="button" class="skill-chip ${user.skills.includes(skill) ? 'skill-chip--selected' : ''}" data-skill="${skill}">${skill}</button>
        `).join('')}
      </div>
    </div>
  `).join('');

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  const avatarContent = user.avatarUrl
    ? `<img id="edit-avatar-preview" src="${user.avatarUrl}" alt="${user.name}'s profile photo" />`
    : `<img id="edit-avatar-preview" src="" alt="" style="display: none;" /><span class="avatar-placeholder" id="edit-avatar-placeholder">${getInitials(user.name)}</span>`;

  return `
    <nav class="page-nav">
      <a href="#profile" class="brand" style="text-decoration: none;">
        <span class="brand__icon" style="font-size: var(--fs-xl);">🔄</span>
        <span class="brand__name">SkillSwap</span>
      </a>
      <div class="page-nav__actions">
        <button class="btn btn-ghost" id="edit-cancel-nav">Cancel</button>
      </div>
    </nav>

    <div class="edit-page fade-in" style="padding-top: 80px;">
      <div class="glass-card glass-card--profile">
        <div class="edit-header">
          <h1 class="edit-header__title">Edit Profile</h1>
        </div>

        <form id="edit-form" class="edit-form" novalidate>
          <!-- Avatar -->
          <div class="edit-avatar-section">
            <div class="avatar avatar--xl avatar-upload" id="edit-avatar-container">
              ${avatarContent}
              <div class="avatar-upload-overlay">Change</div>
            </div>
            <input type="file" id="edit-avatar-input" accept="image/*" hidden />
            <button type="button" class="btn btn-ghost" id="edit-avatar-btn">Change Photo</button>
          </div>

          <!-- Name -->
          <div class="form-group">
            <label class="form-label" for="edit-name">Full Name *</label>
            <input id="edit-name" class="form-input" type="text" value="${user.name}" required />
            <span class="form-error" id="edit-name-error"></span>
          </div>

          <!-- College & Department -->
          <div class="edit-row">
            <div class="form-group">
              <label class="form-label" for="edit-college">College *</label>
              <input id="edit-college" class="form-input" type="text" value="${user.college}" required />
              <span class="form-error" id="edit-college-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-department">Department *</label>
              <input id="edit-department" class="form-input" type="text" value="${user.department}" required />
              <span class="form-error" id="edit-department-error"></span>
            </div>
          </div>

          <!-- Year -->
          <div class="form-group">
            <label class="form-label" for="edit-year">Year *</label>
            <select id="edit-year" class="form-input form-select" required>
              <option value="" disabled>Select your year</option>
              <option value="1st Year" ${user.year === '1st Year' ? 'selected' : ''}>1st Year</option>
              <option value="2nd Year" ${user.year === '2nd Year' ? 'selected' : ''}>2nd Year</option>
              <option value="3rd Year" ${user.year === '3rd Year' ? 'selected' : ''}>3rd Year</option>
              <option value="4th Year" ${user.year === '4th Year' ? 'selected' : ''}>4th Year</option>
              <option value="PG" ${user.year === 'PG' ? 'selected' : ''}>Postgraduate</option>
            </select>
            <span class="form-error" id="edit-year-error"></span>
          </div>

          <!-- Skills -->
          <div class="setup-skills-section">
            <div class="form-group">
              <label class="form-label">Your Skills * <span style="font-weight: var(--fw-regular); color: var(--clr-text-muted);">(select at least 1)</span></label>
              <span class="form-error" id="edit-skills-error"></span>
            </div>
            ${skillChipsHTML}
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label class="form-label" for="edit-bio">Bio</label>
            <textarea id="edit-bio" class="form-input">${user.bio || ''}</textarea>
          </div>

          <div class="edit-actions">
            <button type="button" class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary btn-lg" id="edit-save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initProfileEdit() {
  const form = document.getElementById('edit-form');
  if (!form) return;

  const user = getCurrentUser();
  const nameInput = document.getElementById('edit-name');
  const collegeInput = document.getElementById('edit-college');
  const departmentInput = document.getElementById('edit-department');
  const yearInput = document.getElementById('edit-year');
  const bioInput = document.getElementById('edit-bio');
  const avatarInput = document.getElementById('edit-avatar-input');
  const avatarBtn = document.getElementById('edit-avatar-btn');
  const avatarContainer = document.getElementById('edit-avatar-container');
  const avatarPreview = document.getElementById('edit-avatar-preview');
  const avatarPlaceholder = document.getElementById('edit-avatar-placeholder');

  let selectedSkills = new Set(user.skills || []);
  let avatarDataUrl = user.avatarUrl || '';

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
      if (avatarPreview) {
        avatarPreview.src = avatarDataUrl;
        avatarPreview.style.display = 'block';
      }
      if (avatarPlaceholder) {
        avatarPlaceholder.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  });

  // Skill chip toggling
  document.querySelectorAll('#edit-form .skill-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const skill = chip.dataset.skill;
      if (selectedSkills.has(skill)) {
        selectedSkills.delete(skill);
        chip.classList.remove('skill-chip--selected');
      } else {
        selectedSkills.add(skill);
        chip.classList.add('skill-chip--selected');
      }
      document.getElementById('edit-skills-error').textContent = '';
    });
  });

  // Cancel buttons
  document.getElementById('edit-cancel-btn')?.addEventListener('click', () => navigate('profile'));
  document.getElementById('edit-cancel-nav')?.addEventListener('click', () => navigate('profile'));

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { input: nameInput, errorId: 'edit-name-error', label: 'Name' },
      { input: collegeInput, errorId: 'edit-college-error', label: 'College' },
      { input: departmentInput, errorId: 'edit-department-error', label: 'Department' },
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
      document.getElementById('edit-year-error').textContent = 'Please select your year.';
      yearInput.classList.add('form-input--error');
      valid = false;
    }

    if (selectedSkills.size === 0) {
      document.getElementById('edit-skills-error').textContent = 'Please select at least one skill.';
      valid = false;
    }

    if (!valid) return;

    const result = updateProfile({
      name: nameInput.value.trim(),
      college: collegeInput.value.trim(),
      department: departmentInput.value.trim(),
      year: yearInput.value,
      skills: Array.from(selectedSkills),
      bio: bioInput.value.trim(),
      avatarUrl: avatarDataUrl,
    });

    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }

    showToast('Profile updated successfully!', 'success');
    navigate('profile');
  });
}
