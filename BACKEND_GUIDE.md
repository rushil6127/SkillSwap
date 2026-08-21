# SkillSwap — Backend Core Developer Guide

Welcome to the Backend Core for SkillSwap! This guide explains how to set up the database, connect to Supabase, and use the backend services and TypeScript types.

---

## 1. Quick Setup & Environment

Copy the example environment file:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role secret key (backend only)

---

## 2. Database Migrations & Seeds

All database schema, security policies, and seed data are located in `supabase/`:

1. **`supabase/migrations/20260821000000_initial_schema.sql`**
   - Creates custom enums (`skill_type`, `skill_level`, `request_status`, `offer_status`, `swap_status`, `notification_type`).
   - Defines all 10 core tables (`users`, `skills`, `user_skills`, `requests`, `offers`, `swaps`, `messages`, `transactions`, `ratings`, `notifications`).
   - Sets up foreign keys, unique constraints, check constraints, and performance indexes.

2. **`supabase/migrations/20260821000001_security_and_triggers.sql`**
   - Enables **Row Level Security (RLS)** across all tables.
   - **`handle_new_user()` Trigger**: Automatically creates a `users` profile with **20 starting SkillCredits** and a welcome notification upon signup in `auth.users`.
   - **`transfer_credits_atomic()` Procedure**: Performs atomic, server-side credit transfers with balance validation upon swap completion.

3. **`supabase/seed.sql`**
   - Populates initial campus skills across Technology, Academic, Creative, and Communication.

---

## 3. Architecture & Code Structure

```text
src/
├── index.ts                     # Central barrel export
├── types/
│   ├── database.ts              # Database row models and enums
│   ├── user.ts                  # User profile and search types
│   ├── skills.ts                # Skills catalog and user-skills types
│   └── auth.ts                  # Authentication input and session types
└── lib/
    ├── supabase/
    │   ├── client.ts            # Browser Supabase client
    │   ├── server.ts            # Server-side Supabase client
    │   └── admin.ts             # Service Role admin client (atomic operations)
    ├── validations/
    │   ├── auth.ts              # Signup and signin validation rules
    │   ├── user.ts              # Profile update validation rules
    │   └── skills.ts            # Skill creation and assignment validation
    └── services/
        ├── auth-service.ts      # SignUp, SignIn, SignOut, GetSession
        ├── user-service.ts      # Profile retrieval, updates, user search
        ├── skills-service.ts    # Skill catalog, user skills assignment
        └── transaction-service.ts # Atomic credit transfers and balance checks
```

---

## 4. Usage Examples for Teammates

### Authentication (Person 1 / Frontend)
```typescript
import { AuthService } from '@/lib/services/auth-service';

// Register student
const { user, error } = await AuthService.signUp({
  email: 'student@campus.edu',
  password: 'securePassword123',
  name: 'Priya Sharma',
  college: 'Engineering Campus',
  department: 'Computer Science',
  year: 3,
  bio: 'Passionate React and Python developer.'
});

// Check current session
const { user: currentUser, isAuthenticated } = await AuthService.getCurrentSession();
```

### User Profiles (Person 1 / Frontend)
```typescript
import { UserService } from '@/lib/services/user-service';

// Get full profile with skills offered and needed
const { profile, error } = await UserService.getUserProfile(userId);

// Update bio and year
await UserService.updateUserProfile(userId, {
  bio: 'Updated bio',
  year: 4
});
```

### Skills Management (Person 3 / Marketplace)
```typescript
import { SkillsService } from '@/lib/services/skills-service';

// List technology skills
const { skills } = await SkillsService.getAllSkills('Technology');

// Add a skill that user can offer
await SkillsService.setUserSkill(userId, {
  skill_id: 'skill-uuid',
  type: 'OFFER',
  level: 'ADVANCED'
});
```

### Credits & Swap Completion (Person 2 & 4 / Backend & Swap Loop)
```typescript
import { TransactionService } from '@/lib/services/transaction-service';

// Check balance
const { balance } = await TransactionService.getUserBalance(userId);

// Complete swap and transfer credits atomically
const result = await TransactionService.transferCreditsAtomic(
  swapId,
  requesterId,
  providerId,
  10, // 10 SkillCredits
  'Completed React debugging swap'
);
```

---

## 5. Security Principles Implemented
- **Credit Balance Isolation**: Credits cannot be updated via direct client REST/Supabase mutations (enforced by RLS and stored procedures).
- **Session Protection**: Only authenticated participants can access swap messages and private notifications.
- **Atomic Operations**: Credit balance decrement/increment and transaction logging execute within a single atomic database transaction.
