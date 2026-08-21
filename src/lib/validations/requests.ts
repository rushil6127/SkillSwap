import { CreateRequestInput, RequestFilters, UpdateRequestInput } from '../../types/requests';
import { RequestStatus } from '../../types/database';
import { ValidationResult } from './auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES: RequestStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

/**
 * Validates request creation input
 */
export function validateCreateRequestInput(input: unknown): ValidationResult<CreateRequestInput> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid request creation payload.' } };
  }

  const payload = input as Record<string, unknown>;

  // Title validation
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title || title.length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  } else if (title.length > 255) {
    errors.title = 'Title cannot exceed 255 characters.';
  }

  // Description validation
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  if (!description || description.length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  } else if (description.length > 5000) {
    errors.description = 'Description cannot exceed 5000 characters.';
  }

  // Skill ID validation
  const skillId = typeof payload.skill_id === 'string' ? payload.skill_id.trim() : '';
  if (!skillId) {
    errors.skill_id = 'A required skill must be selected.';
  } else if (!UUID_REGEX.test(skillId)) {
    errors.skill_id = 'Invalid skill ID format.';
  }

  // Credits Offered validation (strictly whole integer > 0)
  const rawCredits = payload.credits_offered;
  const credits = typeof rawCredits === 'number' ? rawCredits : Number(rawCredits);
  if (rawCredits === undefined || rawCredits === null || isNaN(credits)) {
    errors.credits_offered = 'SkillCredit reward is required.';
  } else if (!Number.isInteger(credits)) {
    errors.credits_offered = 'SkillCredits must be a whole integer number (no decimal amounts).';
  } else if (credits <= 0) {
    errors.credits_offered = 'SkillCredit reward must be greater than zero.';
  } else if (credits > 1000) {
    errors.credits_offered = 'SkillCredit reward cannot exceed 1000 credits.';
  }

  // Deadline validation (must be a valid date in the future)
  const rawDeadline = payload.deadline;
  if (!rawDeadline || typeof rawDeadline !== 'string') {
    errors.deadline = 'A valid deadline date is required.';
  } else {
    const deadlineDate = new Date(rawDeadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.deadline = 'Invalid deadline date format.';
    } else if (deadlineDate.getTime() <= Date.now()) {
      errors.deadline = 'Deadline must be set to a future date and time.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      description,
      skill_id: skillId,
      credits_offered: credits,
      deadline: new Date(rawDeadline as string).toISOString(),
    },
  };
}

/**
 * Validates request update input
 */
export function validateUpdateRequestInput(input: unknown): ValidationResult<UpdateRequestInput> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid request update payload.' } };
  }

  const payload = input as Record<string, unknown>;
  const data: UpdateRequestInput = {};

  if (payload.title !== undefined) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title || title.length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    } else if (title.length > 255) {
      errors.title = 'Title cannot exceed 255 characters.';
    } else {
      data.title = title;
    }
  }

  if (payload.description !== undefined) {
    const description = typeof payload.description === 'string' ? payload.description.trim() : '';
    if (!description || description.length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    } else if (description.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters.';
    } else {
      data.description = description;
    }
  }

  if (payload.skill_id !== undefined) {
    const skillId = typeof payload.skill_id === 'string' ? payload.skill_id.trim() : '';
    if (!skillId) {
      errors.skill_id = 'Skill ID cannot be empty.';
    } else if (!UUID_REGEX.test(skillId)) {
      errors.skill_id = 'Invalid skill ID format.';
    } else {
      data.skill_id = skillId;
    }
  }

  if (payload.credits_offered !== undefined) {
    const rawCredits = payload.credits_offered;
    const credits = typeof rawCredits === 'number' ? rawCredits : Number(rawCredits);
    if (isNaN(credits)) {
      errors.credits_offered = 'SkillCredit reward must be a valid number.';
    } else if (!Number.isInteger(credits)) {
      errors.credits_offered = 'SkillCredits must be a whole integer number (no decimal amounts).';
    } else if (credits <= 0) {
      errors.credits_offered = 'SkillCredit reward must be greater than zero.';
    } else if (credits > 1000) {
      errors.credits_offered = 'SkillCredit reward cannot exceed 1000 credits.';
    } else {
      data.credits_offered = credits;
    }
  }

  if (payload.deadline !== undefined) {
    const rawDeadline = payload.deadline;
    if (!rawDeadline || typeof rawDeadline !== 'string') {
      errors.deadline = 'Deadline must be a valid ISO date string.';
    } else {
      const deadlineDate = new Date(rawDeadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.deadline = 'Invalid deadline date format.';
      } else if (deadlineDate.getTime() <= Date.now()) {
        errors.deadline = 'Deadline must be set to a future date and time.';
      } else {
        data.deadline = deadlineDate.toISOString();
      }
    }
  }

  if (payload.status !== undefined) {
    const status = payload.status as RequestStatus;
    if (!VALID_STATUSES.includes(status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    } else {
      data.status = status;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

/**
 * Sanitizes and normalizes request filter parameters
 */
export function sanitizeRequestFilters(raw: unknown): RequestFilters {
  if (!raw || typeof raw !== 'object') {
    return { limit: 20, offset: 0, orderBy: 'created_at', orderDirection: 'desc' };
  }

  const p = raw as Record<string, unknown>;
  const filters: RequestFilters = {};

  if (p.status) {
    if (Array.isArray(p.status)) {
      filters.status = p.status.filter((s): s is RequestStatus => VALID_STATUSES.includes(s as RequestStatus));
    } else if (typeof p.status === 'string' && VALID_STATUSES.includes(p.status as RequestStatus)) {
      filters.status = p.status as RequestStatus;
    }
  }

  if (typeof p.skill_id === 'string' && UUID_REGEX.test(p.skill_id.trim())) {
    filters.skill_id = p.skill_id.trim();
  }

  if (typeof p.category === 'string' && p.category.trim()) {
    filters.category = p.category.trim();
  }

  if (typeof p.creator_id === 'string' && UUID_REGEX.test(p.creator_id.trim())) {
    filters.creator_id = p.creator_id.trim();
  }

  if (typeof p.search === 'string' && p.search.trim()) {
    filters.search = p.search.trim();
  }

  if (p.minCredits !== undefined) {
    const min = Number(p.minCredits);
    if (!isNaN(min) && min >= 0) filters.minCredits = Math.floor(min);
  }

  if (p.maxCredits !== undefined) {
    const max = Number(p.maxCredits);
    if (!isNaN(max) && max >= 0) filters.maxCredits = Math.floor(max);
  }

  const rawLimit = Number(p.limit);
  filters.limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 20;

  const rawOffset = Number(p.offset);
  filters.offset = !isNaN(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  const validOrderFields: Array<'created_at' | 'deadline' | 'credits_offered'> = ['created_at', 'deadline', 'credits_offered'];
  if (typeof p.orderBy === 'string' && validOrderFields.includes(p.orderBy as 'created_at' | 'deadline' | 'credits_offered')) {
    filters.orderBy = p.orderBy as 'created_at' | 'deadline' | 'credits_offered';
  } else {
    filters.orderBy = 'created_at';
  }

  filters.orderDirection = p.orderDirection === 'asc' ? 'asc' : 'desc';

  return filters;
}
