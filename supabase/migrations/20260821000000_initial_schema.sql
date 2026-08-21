-- ==============================================================================
-- SkillSwap Initial Database Schema Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE skill_type AS ENUM ('OFFER', 'NEED');
CREATE TYPE skill_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE request_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE offer_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE swap_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE notification_type AS ENUM (
  'SWAP_OFFER',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'MESSAGE',
  'CREDIT_TRANSFER',
  'RATING_RECEIVED'
);

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  avatar_url TEXT,
  college VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  year SMALLINT NOT NULL CHECK (year >= 1 AND year <= 8),
  bio TEXT,
  credits_balance INTEGER NOT NULL DEFAULT 20 CHECK (credits_balance >= 0),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER_SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  type skill_type NOT NULL,
  level skill_level NOT NULL DEFAULT 'INTERMEDIATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_skill_type UNIQUE (user_id, skill_id, type)
);

-- 4. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
  credits_offered INTEGER NOT NULL CHECK (credits_offered > 0),
  deadline TIMESTAMPTZ NOT NULL,
  status request_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status offer_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_request_provider_offer UNIQUE (request_id, provider_id)
);

-- 6. SWAPS TABLE
CREATE TABLE IF NOT EXISTS public.swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE RESTRICT,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  status swap_status NOT NULL DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT check_different_participants CHECK (requester_id != provider_id)
);

-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID NOT NULL REFERENCES public.swaps(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES public.swaps(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID NOT NULL REFERENCES public.swaps(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_swap_reviewer UNIQUE (swap_id, reviewer_id)
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_college_dept ON public.users(college, department);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_skill ON public.requests(skill_id);
CREATE INDEX IF NOT EXISTS idx_requests_creator ON public.requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_offers_request ON public.offers(request_id);
CREATE INDEX IF NOT EXISTS idx_offers_provider ON public.offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_swaps_requester ON public.swaps(requester_id);
CREATE INDEX IF NOT EXISTS idx_swaps_provider ON public.swaps(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_swap_created ON public.messages(swap_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_transactions_users ON public.transactions(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
