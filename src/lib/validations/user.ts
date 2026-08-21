import { UpdateUserProfileInput } from '../../types/user';
import { ValidationResult } from './auth';

export function validateUpdateUserProfileInput(input: unknown): ValidationResult<UpdateUserProfileInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid profile update payload' } };
  }

  const payload = input as Record<string, unknown>;
  const data: UpdateUserProfileInput = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else {
      data.name = payload.name.trim();
    }
  }

  if (payload.avatar_url !== undefined) {
    data.avatar_url = typeof payload.avatar_url === 'string' ? payload.avatar_url.trim() : null;
  }

  if (payload.college !== undefined) {
    if (typeof payload.college !== 'string' || !payload.college.trim()) {
      errors.college = 'College name cannot be empty.';
    } else {
      data.college = payload.college.trim();
    }
  }

  if (payload.department !== undefined) {
    if (typeof payload.department !== 'string' || !payload.department.trim()) {
      errors.department = 'Department cannot be empty.';
    } else {
      data.department = payload.department.trim();
    }
  }

  if (payload.year !== undefined) {
    const year = typeof payload.year === 'number' ? payload.year : parseInt(String(payload.year), 10);
    if (isNaN(year) || year < 1 || year > 8) {
      errors.year = 'Year must be between 1 and 8.';
    } else {
      data.year = year;
    }
  }

  if (payload.bio !== undefined) {
    data.bio = typeof payload.bio === 'string' ? payload.bio.trim() : null;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}
