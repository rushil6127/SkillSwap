# SkillSwap — Development Phases & Team Split

## 1. Team Structure

Assume a team of 4 students.

### Person 1 — Frontend & Design Lead
Owns:
- Design system
- Landing/login UI
- Dashboard
- Profiles
- Shared components
- Responsive layout

### Person 2 — Backend & Database Lead
Owns:
- Database schema
- Authentication integration
- API/server actions
- Authorization
- SkillCredit transaction logic

### Person 3 — Marketplace & Matching Lead
Owns:
- Skills
- Discover page
- Request board
- Create request
- Offer/accept flow
- Matching logic

### Person 4 — Messaging, Testing & Integration Lead
Owns:
- Messaging
- Notifications
- Ratings
- Integration testing
- Deployment support
- Demo preparation

Important: everyone should review each other's work. Ownership does not mean working in isolation.

---

# Phase 0 — Planning

## Goal
Agree on the product and architecture before coding.

### Tasks

Person 1:
- Finalize wireframes.
- Define design tokens.
- Create component list.

Person 2:
- Finalize database schema.
- Configure backend/database.
- Define authentication approach.

Person 3:
- Define request/offer/swap states.
- Define matching score.

Person 4:
- Define messaging flow.
- Define testing checklist.
- Create demo scenario.

### Deliverable
A shared architecture and UI plan.

---

# Phase 1 — Project Foundation

## Goal
Get the application running for everyone.

Tasks:
- Repository setup
- TypeScript configuration
- Styling setup
- Environment variables
- Database connection
- Authentication
- Base layout
- Navigation
- Shared UI components

### Exit condition

All four team members can:
- Clone the project.
- Install dependencies.
- Run the project.
- Access the same development environment.

---

# Phase 2 — Profiles & Skills

## Person 1
Build:
- Profile page
- Edit profile
- Profile card
- Skill chips
- Dashboard layout

## Person 2
Build:
- User table
- Skills table
- User-skills relationship
- Authentication/user authorization

## Person 3
Build:
- Skill selection/search
- Offer/need skill logic

## Person 4
Test:
- Registration
- Login
- Profile creation
- Profile editing

### Exit condition

A student can create an account and profile with skills.

---

# Phase 3 — Request Marketplace

## Person 1
Build:
- Request board UI
- Request cards
- Filters
- Request details page

## Person 2
Build:
- Requests table
- Request API/server actions
- Ownership validation

## Person 3
Build:
- Create request
- Edit request
- Offer help
- Accept/reject offer
- Request status management

## Person 4
Test:
- Request creation
- Request visibility
- Offer flow
- Authorization edge cases

### Exit condition

Student A can post a request and Student B can offer help.

---

# Phase 4 — Swap & Messaging

## Person 1
Polish:
- Swap details page
- Chat UI
- Message states

## Person 2
Build:
- Swap records
- Messaging data access
- Authorization

## Person 3
Integrate:
- Accepted offer → active swap
- Request status changes

## Person 4
Build:
- Real-time messaging
- Notifications
- Message testing

### Exit condition

Two users can accept a swap and communicate.

---

# Phase 5 — SkillCredits

## Person 1
Build:
- Wallet UI
- Credit balance card
- Transaction history UI

## Person 2
Build:
- Transaction system
- Atomic credit transfer
- Server-side validation

## Person 3
Integrate:
- Reward display
- Request credit validation

## Person 4
Test:
- Successful transfer
- Duplicate completion prevention
- Insufficient balance
- Unauthorized requests

### Exit condition

A completed swap reliably transfers SkillCredits.

---

# Phase 6 — Ratings & Trust

Person 1:
- Rating UI
- Profile reputation display

Person 2:
- Rating database/API

Person 3:
- Rating integration after completed swap

Person 4:
- Test rating rules and edge cases

### Exit condition

Completed swaps can produce reputation.

---

# Phase 7 — Matching & Polish

Person 1:
- Visual polish
- Responsive design
- Empty/loading/error states

Person 2:
- Performance/security review

Person 3:
- Match score
- Recommended helpers

Person 4:
- Full integration testing
- Bug triage
- Deployment

### Exit condition

Core MVP is stable and demo-ready.

---

# Phase 8 — Final Hackathon Preparation

## Team tasks

### Demo flow

1. Login as Student A.
2. Show profile.
3. Create request.
4. Switch to Student B.
5. Discover request.
6. Offer help.
7. Switch back to Student A.
8. Accept offer.
9. Open chat.
10. Exchange messages.
11. Complete swap.
12. Show SkillCredit transfer.
13. Show rating/reputation.

### Final checklist

- [ ] Authentication works
- [ ] Profiles work
- [ ] Skills work
- [ ] Request board works
- [ ] Offer flow works
- [ ] Chat works
- [ ] Credits work
- [ ] Ratings work
- [ ] Mobile layout works
- [ ] Production build works
- [ ] Demo accounts are ready
- [ ] Backup demo data exists

## Critical Rule

Do not start advanced features until the complete swap loop works.

**Complete swap loop:**

Profile → Request → Offer → Accept → Chat → Complete → Credits → Rating
