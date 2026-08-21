/* ============================================
   SkillSwap — Predefined Skills Data
   ============================================ */

export const SKILL_CATEGORIES = [
  {
    name: 'Technology',
    skills: [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'React',
      'Node.js', 'HTML/CSS', 'C/C++', 'SQL', 'Git',
      'Web Development', 'Debugging', 'Data Structures',
      'Machine Learning', 'App Development',
    ],
  },
  {
    name: 'Academic',
    skills: [
      'Mathematics', 'Physics', 'Chemistry', 'Statistics',
      'Economics', 'Biology', 'English Literature',
      'Research Writing', 'Lab Reports', 'Exam Prep',
    ],
  },
  {
    name: 'Creative',
    skills: [
      'Graphic Design', 'Figma', 'Photoshop', 'Video Editing',
      'Photography', 'Presentation Design', 'UI/UX Design',
      'Animation', 'Illustration', 'Content Writing',
    ],
  },
  {
    name: 'Communication',
    skills: [
      'English', 'Public Speaking', 'Resume Review',
      'Presentation Practice', 'Interview Prep',
      'Technical Writing', 'Essay Writing',
    ],
  },
];

/** Flat list of all skill names */
export const ALL_SKILLS = SKILL_CATEGORIES.flatMap(c => c.skills);
