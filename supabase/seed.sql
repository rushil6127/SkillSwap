-- ==============================================================================
-- SkillSwap Initial Skills Catalog Seed Data
-- ==============================================================================

INSERT INTO public.skills (name, category) VALUES
  -- Technology
  ('Python', 'Technology'),
  ('Java', 'Technology'),
  ('JavaScript', 'Technology'),
  ('TypeScript', 'Technology'),
  ('React', 'Technology'),
  ('Next.js', 'Technology'),
  ('Node.js', 'Technology'),
  ('HTML & CSS', 'Technology'),
  ('SQL & Databases', 'Technology'),
  ('Git & GitHub', 'Technology'),
  ('Debugging & Code Review', 'Technology'),
  ('Data Structures & Algorithms', 'Technology'),
  ('Mobile App Development', 'Technology'),
  
  -- Academic
  ('Calculus & Mathematics', 'Academic'),
  ('Linear Algebra', 'Academic'),
  ('Physics', 'Academic'),
  ('Chemistry', 'Academic'),
  ('Statistics & Probability', 'Academic'),
  ('Economics & Microeconomics', 'Academic'),
  ('Machine Learning Basics', 'Academic'),
  ('Essay & Research Writing', 'Academic'),
  ('Exam Preparation & Tutoring', 'Academic'),
  
  -- Creative
  ('Graphic Design', 'Creative'),
  ('Figma & UI/UX Design', 'Creative'),
  ('Video Editing', 'Creative'),
  ('Audio & Podcast Editing', 'Creative'),
  ('Photography & Photo Editing', 'Creative'),
  ('Presentation & Slide Deck Design', 'Creative'),
  ('Illustration & Digital Art', 'Creative'),
  
  -- Communication
  ('Public Speaking', 'Communication'),
  ('English Conversation & Grammar', 'Communication'),
  ('Resume & CV Review', 'Communication'),
  ('Interview Preparation', 'Communication'),
  ('Presentation Coaching', 'Communication'),
  ('Academic Peer Review', 'Communication')
ON CONFLICT (name) DO NOTHING;
