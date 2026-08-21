# SkillSwap — Architecture

## 1. Architecture Goal

Build a simple, maintainable full-stack web application suitable for a 4-person hackathon team.

The architecture should prioritize:
- Fast development
- Clear ownership
- Secure data access
- Easy local setup
- Easy deployment
- Real-time messaging
- Reliable SkillCredit transactions

## 2. Recommended Stack

### Frontend
- Next.js / React
- TypeScript
- Tailwind CSS
- Component library only where useful

### Backend
Preferred simple option:
- Next.js server/API routes or a lightweight Node.js API

### Database
- PostgreSQL

### Authentication
- Supabase Auth or another managed authentication provider

### Realtime
- Supabase Realtime or WebSocket/Socket.IO

### Deployment
- Vercel for frontend/full-stack Next.js
- Managed PostgreSQL/Supabase for database

The team may substitute equivalent technologies if required by the hackathon environment.

## 3. High-Level Architecture

```text
Browser
   |
   v
React / Next.js UI
   |
   +----------------------+
   |                      |
   v                      v
Application/API       Realtime Layer
   |                      |
   v                      v
PostgreSQL <--------- Messages
   |
   +---- Users
   +---- Skills
   +---- Requests
   +---- Offers
   +---- Swaps
   +---- Transactions
   +---- Ratings
   +---- Notifications
```

## 4. Core Data Model

### users
- id
- name
- email
- avatar_url
- college
- department
- year
- bio
- credits_balance
- rating
- created_at

### skills
- id
- name
- category

### user_skills
- id
- user_id
- skill_id
- type: OFFER / NEED
- level

### requests
- id
- creator_id
- title
- description
- skill_id
- credits_offered
- deadline
- status
- created_at
- updated_at

### offers
- id
- request_id
- provider_id
- message
- status
- created_at

### swaps
- id
- request_id
- requester_id
- provider_id
- credits
- status
- started_at
- completed_at

### messages
- id
- swap_id
- sender_id
- content
- created_at

### transactions
- id
- swap_id
- from_user_id
- to_user_id
- amount
- reason
- created_at

### ratings
- id
- swap_id
- reviewer_id
- reviewee_id
- score
- comment
- created_at

### notifications
- id
- user_id
- type
- title
- message
- read
- created_at

## 5. Authorization Rules

Users may:
- Edit their own profile.
- Edit/delete their own requests.
- Make offers on open requests.
- Message participants in their active swap.
- Complete swaps they are authorized to complete.
- Rate participants after completion.

Users may not:
- Modify another user's credits.
- Modify another user's transactions.
- Access unrelated private conversations.
- Complete a swap they do not participate in.
- Change a completed transaction manually.

## 6. Credit Transfer

Credit transfer must happen server-side.

Recommended flow:

```text
User confirms completion
        |
        v
Validate swap
        |
        v
Validate requester balance
        |
        v
Create transaction
        |
        v
Decrease requester balance
        |
        v
Increase provider balance
        |
        v
Mark swap completed
```

All related database operations should be atomic.

## 7. Matching Logic

Initial version can use weighted scoring.

Example:

```text
match_score =
  skill_match * 0.45
+ availability_match * 0.20
+ rating_score * 0.15
+ department_relevance * 0.10
+ activity_score * 0.10
```

This is intentionally simple and explainable.

Do not introduce machine learning unless the core MVP is already working.

## 8. API Areas

Suggested endpoints/actions:

### Auth
- register
- login
- logout
- current user

### Users
- get profile
- update profile
- search users

### Skills
- list skills
- create/search skills if permitted

### Requests
- list requests
- get request
- create request
- update request
- delete request

### Offers
- create offer
- list offers
- accept offer
- reject offer

### Swaps
- get swap
- complete swap
- cancel swap

### Messages
- get conversation
- send message

### Wallet
- get balance
- get transactions

### Ratings
- create rating
- get ratings

## 9. Security

- Never trust client-side credit amounts.
- Validate all IDs server-side.
- Validate ownership before mutations.
- Use authenticated sessions.
- Keep API keys and secrets in environment variables.
- Sanitize/validate user-generated content.
- Rate-limit sensitive actions where practical.
- Prevent duplicate completion/credit transfers.

## 10. Error Handling

Every important operation should support:
- Loading state
- Empty state
- Success state
- Recoverable error
- Unauthorized state

Use clear messages such as:

> "This request is no longer available."

rather than technical database errors.

## 11. Development Principle

Build vertically.

Do not spend the first half of the hackathon creating every database table and every API.

Get this working first:

**Login → Profile → Request → Offer → Accept → Chat → Complete → Credits**

Then add polish.
