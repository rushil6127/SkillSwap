/* ============================================
   SkillSwap — localStorage-backed Data Store
   ============================================ */

const STORAGE_KEYS = {
  USERS: 'skillswap_users',
  SESSION: 'skillswap_session',
};

const INITIAL_CREDITS = 500;

/** Get all registered users */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  } catch {
    return [];
  }
}

/** Save users array */
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/** Get currently logged-in user ID */
function getSessionUserId() {
  return localStorage.getItem(STORAGE_KEYS.SESSION);
}

/** Get the current user object */
export function getCurrentUser() {
  const id = getSessionUserId();
  if (!id) return null;
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

/** Check if a user is logged in */
export function isLoggedIn() {
  return !!getSessionUserId();
}

/** Check if current user has completed profile setup */
export function isProfileComplete() {
  const user = getCurrentUser();
  if (!user) return false;
  return !!user.profileComplete;
}

/**
 * Register a new user.
 * @returns {{ success: boolean, error?: string }}
 */
export function registerUser(email, password) {
  const users = getUsers();
  const emailLower = email.toLowerCase().trim();

  if (users.find(u => u.email === emailLower)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const newUser = {
    id: crypto.randomUUID(),
    email: emailLower,
    password, // In real app, this would be hashed server-side
    name: '',
    avatarUrl: '',
    college: '',
    department: '',
    year: '',
    bio: '',
    skills: [],
    creditsBalance: 0,
    rating: 0,
    ratingCount: 0,
    completedSwaps: 0,
    profileComplete: false,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login after registration
  localStorage.setItem(STORAGE_KEYS.SESSION, newUser.id);

  return { success: true };
}

/**
 * Login with email and password.
 * @returns {{ success: boolean, error?: string }}
 */
export function loginUser(email, password) {
  const users = getUsers();
  const emailLower = email.toLowerCase().trim();
  const user = users.find(u => u.email === emailLower);

  if (!user) {
    return { success: false, error: 'No account found with this email.' };
  }

  if (user.password !== password) {
    return { success: false, error: 'Incorrect password.' };
  }

  localStorage.setItem(STORAGE_KEYS.SESSION, user.id);
  return { success: true };
}

/** Logout the current user */
export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Complete profile setup — awards initial credits.
 * @returns {{ success: boolean, error?: string }}
 */
export function completeProfileSetup(profileData) {
  const userId = getSessionUserId();
  if (!userId) return { success: false, error: 'Not logged in.' };

  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, error: 'User not found.' };

  users[idx] = {
    ...users[idx],
    name: profileData.name,
    college: profileData.college,
    department: profileData.department,
    year: profileData.year,
    skills: profileData.skills || [],
    bio: profileData.bio || '',
    avatarUrl: profileData.avatarUrl || '',
    creditsBalance: INITIAL_CREDITS,
    profileComplete: true,
  };

  saveUsers(users);
  return { success: true };
}

/**
 * Update an existing profile.
 * @returns {{ success: boolean, error?: string }}
 */
export function updateProfile(profileData) {
  const userId = getSessionUserId();
  if (!userId) return { success: false, error: 'Not logged in.' };

  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, error: 'User not found.' };

  users[idx] = {
    ...users[idx],
    name: profileData.name ?? users[idx].name,
    college: profileData.college ?? users[idx].college,
    department: profileData.department ?? users[idx].department,
    year: profileData.year ?? users[idx].year,
    skills: profileData.skills ?? users[idx].skills,
    bio: profileData.bio ?? users[idx].bio,
    avatarUrl: profileData.avatarUrl ?? users[idx].avatarUrl,
  };

  saveUsers(users);
  return { success: true };
}
