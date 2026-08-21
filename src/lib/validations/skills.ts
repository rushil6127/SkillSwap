import { SetUserSkillInput, CreateSkillInput, SkillLevel, SkillType } from '../../types/skills';
import { ValidationResult } from './auth';

const VALID_SKILL_TYPES: SkillType[] = ['OFFER', 'NEED'];
const VALID_SKILL_LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export function validateCreateSkillInput(input: unknown): ValidationResult<CreateSkillInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid skill creation payload' } };
  }

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const category = typeof payload.category === 'string' ? payload.category.trim() : '';

  if (!name || name.length < 2) {
    errors.name = 'Skill name must be at least 2 characters.';
  }

  if (!category) {
    errors.category = 'Category is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { name, category } };
}

export function validateSetUserSkillInput(input: unknown): ValidationResult<SetUserSkillInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object') {
    return { success: false, errors: { form: 'Invalid user skill payload' } };
  }

  const payload = input as Record<string, unknown>;
  const skill_id = typeof payload.skill_id === 'string' ? payload.skill_id.trim() : '';
  const type = payload.type as SkillType;
  const level = (payload.level || 'INTERMEDIATE') as SkillLevel;

  if (!skill_id) {
    errors.skill_id = 'Valid skill ID is required.';
  }

  if (!VALID_SKILL_TYPES.includes(type)) {
    errors.type = 'Type must be OFFER or NEED.';
  }

  if (!VALID_SKILL_LEVELS.includes(level)) {
    errors.level = 'Level must be BEGINNER, INTERMEDIATE, or ADVANCED.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { skill_id, type, level } };
}
