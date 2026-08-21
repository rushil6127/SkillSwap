import type { SkillRow, SkillLevel, SkillType, UserSkillRow } from './database';

export type { SkillRow, SkillLevel, SkillType, UserSkillRow };

export type SkillCategory = 'Technology' | 'Academic' | 'Creative' | 'Communication' | 'Other';

export interface CreateSkillInput {
  name: string;
  category: SkillCategory | string;
}

export interface SetUserSkillInput {
  skill_id: string;
  type: SkillType;
  level: SkillLevel;
}

export interface UserSkillDetail extends UserSkillRow {
  skill: SkillRow;
}
