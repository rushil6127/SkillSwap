# SkillSwap — Marketplace Branch README

## Branch
`feature/marketplace`

## Owner
**Person 3 — Marketplace & Matching**

## 1. Overall Responsibility

Own the complete marketplace experience:

**Student needs help → posts request → another student discovers it → offers help → requester accepts → swap becomes active.**

Your branch focuses on marketplace UI, request/offer flows, skill discovery, filtering, and matching. Integrate with the backend, authentication, messaging, and credit systems owned by other teammates instead of duplicating them.

---

## 2. Main Features

### A. Skill Discovery
Build:
- Search skills
- Skill categories
- Skill cards
- Students offering skills
- Students needing skills
- Filters
- Sorting
- View student/profile
- Start a help request

### B. Public Request Board ⭐
Students can browse active requests.

Each request card should show:
- Title
- Required skill
- Skill level
- Short description
- SkillCredit reward
- Deadline
- Requester
- Department/year
- Avatar
- Status
- View Request action

### C. Create Request
Build a form with:
- Title
- Description
- Required skill
- Category
- Skill level
- SkillCredits offered
- Deadline

Validate required fields, credits, and deadline.

### D. Request Details
Show:
- Full title/description
- Skill and level
- Credit reward
- Deadline
- Requester profile
- Rating
- Completed swaps
- Status
- **Offer Help** button

### E. Offer Help ⭐
A student can offer help on an open request.

Offer form:
- Message
- Submit offer

After submission, show an offer-sent confirmation.

### F. Offer Management
Request owner can view incoming offers and:
- Accept
- Decline

Offer states:
- Pending
- Accepted
- Rejected

### G. Request Status
Support/display:
- Open
- Offer Received
- Accepted
- In Progress
- Completed
- Cancelled

### H. Skill Search
Search for students by skill, including partial/exact skill matches where practical.

### I. Filters
Possible filters:
- Skill
- Category
- Skill level
- Credits
- Deadline
- Department
- Rating
- Availability

### J. Smart Matching
Only after the core marketplace works.

Suggested score:
- Skill match: 45%
- Availability: 20%
- Rating: 15%
- Department: 10%
- Activity: 10%

A simple weighted score is enough; do not build ML for the MVP.

---

## 3. Suggested Components

```text
components/
└── marketplace/
    ├── RequestCard
    ├── RequestList
    ├── RequestFilters
    ├── RequestForm
    ├── RequestDetails
    ├── OfferCard
    ├── OfferModal
    ├── SkillCard
    ├── SkillSearch
    ├── MatchCard
    └── RequestStatus
```

Reuse shared components from Person 1. Do not create duplicates.

---

## 4. Main Pages

Suggested routes:

```text
/discover
/requests
/requests/new
/requests/[id]
/requests/[id]/offers
```

Follow the project's existing routing convention if it differs.

---

## 5. Backend Integration

Person 2 owns backend/database. Coordinate before using endpoints.

Possible operations:

```text
GET    /requests
GET    /requests/:id
POST   /requests
PUT    /requests/:id
DELETE /requests/:id

POST   /requests/:id/offers
GET    /requests/:id/offers

POST   /offers/:id/accept
POST   /offers/:id/reject
```

Agree with Person 2 on:
- Request schema
- Offer schema
- Status values
- Authentication behavior
- Error responses
- Filtering/pagination

Do not independently invent conflicting APIs.

---

## 6. What You Do NOT Own

### Person 2
- Database foundation
- Authentication
- Backend architecture
- User persistence
- Skill persistence
- SkillCredit transaction engine
- Authorization/security foundation

### Person 4
- Real-time messaging
- Notifications
- Ratings
- Integration testing
- Deployment support

### Person 1
- Global design system
- Shared UI components
- Dashboard
- Profiles
- Landing/login UI
- Frontend foundation

You integrate with these systems when needed.

---

## 7. Development Order

### Phase 1 — Core Marketplace
1. Request Board
2. Request Card
3. Create Request
4. Request Details
5. Offer Help
6. Accept/Reject Offer
7. Request Status

### Phase 2 — Discovery
8. Skill Search
9. Skill Categories
10. Filters
11. Student Skill Cards

### Phase 3 — Advanced
12. Match Score
13. Recommended Helpers
14. Better Sorting

### Phase 4 — Polish
15. Loading states
16. Empty states
17. Error states
18. Mobile responsiveness
19. Accessibility
20. Visual polish

---

## 8. Git Workflow

Start your branch:

```bash
git checkout main
git pull origin main
git checkout -b feature/marketplace
```

Commit regularly:

```bash
git status
git add .
git commit -m "feat: add marketplace request board"
git push -u origin feature/marketplace
```

Later:

```bash
git add .
git commit -m "feat: add offer flow"
git push
```

Before merging:

```bash
git checkout main
git pull origin main
git checkout feature/marketplace
git merge main
```

Resolve conflicts, test, then push.

### Suggested commits

```text
feat: add marketplace layout
feat: add request board
feat: add request card
feat: add create request form
feat: add request details page
feat: add offer help flow
feat: add offer management
feat: add request status
feat: add skill discovery
feat: add marketplace filters
feat: add matching score
fix: handle empty request state
fix: validate request form
ui: improve marketplace responsive layout
```

Avoid one giant marketplace commit.

---

## 9. Testing Checklist

### Request Board
- [ ] Requests load
- [ ] Cards display correct data
- [ ] Search works
- [ ] Filters work
- [ ] Loading state works
- [ ] Empty state works
- [ ] Error state works

### Create Request
- [ ] Valid request can be created
- [ ] Required fields are validated
- [ ] Invalid credits are rejected
- [ ] Invalid deadline is rejected
- [ ] Success state appears

### Request Details
- [ ] Correct request is displayed
- [ ] Requester information is displayed
- [ ] Reward is displayed
- [ ] Deadline is displayed
- [ ] Status is displayed
- [ ] Offer Help works

### Offers
- [ ] User can submit an offer
- [ ] Owner can see offers
- [ ] Owner can accept an offer
- [ ] Owner can reject an offer
- [ ] Unauthorized users cannot manage offers

### Matching
- [ ] Match score is calculated
- [ ] Recommended students are relevant
- [ ] No-match state works

### Responsive
- [ ] Mobile works
- [ ] Tablet works
- [ ] Desktop works

---

## 10. Integration With Teammates

### Person 1 — Frontend
Coordinate on:
- Colors
- Typography
- Buttons
- Cards
- Inputs
- Modals
- Navigation
- Responsive behavior

Reuse shared components.

### Person 2 — Backend
Coordinate on:
- Request schema
- Offer schema
- API endpoints
- Authentication
- Request statuses
- Error format
- Skill data
- User data

This is your most important integration.

### Person 4 — Messaging
When an offer is accepted:

```text
Marketplace
    ↓
Offer Accepted
    ↓
Active Swap
    ↓
Messaging
```

Make sure Person 4 gets the correct swap/request identifiers.

---

## 11. Definition of Done

Your branch is complete when this flow works:

```text
Student A
    ↓
Creates "Need React Help"
    ↓
Offers 10 SkillCredits
    ↓
Student B discovers request
    ↓
Student B opens request
    ↓
Student B clicks "Offer Help"
    ↓
Student A sees offer
    ↓
Student A accepts
    ↓
Request becomes "In Progress"
    ↓
Swap is created/linked
    ↓
Messaging takes over
    ↓
Swap eventually completes
    ↓
Credit system transfers credits
    ↓
Rating system records reputation
```

Your branch primarily owns:

**Discovery → Request → Offer → Accept → Active Swap**

---

## 12. Hackathon Priority

If time is running out, stop adding advanced features and make the core flow reliable.

Priority:

1. Request Board
2. Create Request
3. Request Details
4. Offer Help
5. Accept/Reject Offer
6. Request/Swap Status
7. Skill Search
8. Filters
9. Matching
10. Visual polish

A working marketplace flow is more valuable than many unfinished features.

---

## 13. Marketplace North Star

> **I need help → I can find someone on my campus who can help → I can offer them SkillCredits → we can start a swap.**

Build that experience first. Everything else is secondary.
