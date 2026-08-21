import { SignUpInput, SignInInput } from '../../types/auth';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function validateSignUpInput(input: unknown): ValidationResult<SignUpInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid signup payload' } };
  }

  const payload = input as Record<string, unknown>;

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const college = typeof payload.college === 'string' ? payload.college.trim() : '';
  const department = typeof payload.department === 'string' ? payload.department.trim() : '';
  const year = typeof payload.year === 'number' ? payload.year : parseInt(String(payload.year || '0'), 10);
  const bio = typeof payload.bio === 'string' ? payload.bio.trim() : undefined;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please provide a valid campus email address.';
  }

  if (password && password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!name || name.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }

  if (!college) {
    errors.college = 'College/University name is required.';
  }

  if (!department) {
    errors.department = 'Department/Major is required.';
  }

  if (isNaN(year) || year < 1 || year > 8) {
    errors.year = 'Academic year must be between 1 and 8.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { email, password, name, college, department, year, bio },
  };
}

export function validateSignInInput(input: unknown): ValidationResult<SignInInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid login payload' } };
  }

  const payload = input as Record<string, unknown>;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!email) {
    errors.email = 'Email address is required.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { email, password },
  };
}
