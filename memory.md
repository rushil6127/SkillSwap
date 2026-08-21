# SkillSwap — Project Memory

## 1. Project Identity

**Name:** SkillSwap  
**Tagline:** Exchange skills. Earn credits. Help your campus.

## 2. One-Sentence Description

SkillSwap is a campus-local peer-to-peer marketplace where students exchange skills using virtual SkillCredits instead of real money.

## 3. Problem

Students need affordable, fast help with coding, tutoring, design, editing, presentations, and other tasks, while other students already possess those skills.

## 4. Solution

Connect students who need help with students who can help, then facilitate the exchange through virtual credits, messaging, and reputation.

## 5. Core Loop

```text
Student needs help
      ↓
Posts request
      ↓
Another student offers help
      ↓
Requester accepts
      ↓
They chat
      ↓
Work is completed
      ↓
Credits transfer
      ↓
Both rate each other
```

## 6. Product Pillars

### Discover
Find students and skills quickly.

### Exchange
Use SkillCredits instead of money.

### Connect
Coordinate through messaging.

### Trust
Build reputation through completed swaps and ratings.

## 7. Target Environment

Initial focus:
- One college/campus
- Student users
- Academic and practical skills
- Peer-to-peer exchange

## 8. Example Skills

### Technology
- Python
- Java
- JavaScript
- React
- Web development
- Debugging

### Academic
- Mathematics
- Physics
- Chemistry
- Statistics
- Economics

### Creative
- Graphic design
- Figma
- Video editing
- Photography
- Presentation design

### Communication
- English
- Public speaking
- Resume review
- Presentation practice

## 9. Important Product Decisions

- No real-money transactions in MVP.
- SkillCredits are internal virtual credits.
- Campus-first rather than global.
- Messaging is tied to actual swaps.
- Credits transfer only after completion.
- Reputation comes from completed exchanges.
- Smart matching is optional after the core loop.

## 10. Preferred Demo Story

### Student A — Priya
Needs help with React debugging.

Posts:
> "Need help debugging authentication in my React project."

Reward:
**10 SkillCredits**

### Student B — Aarav
Offers:
- React
- JavaScript
- Node.js

Aarav offers help.

Priya accepts.

They chat.

Priya confirms completion.

Aarav receives 10 SkillCredits.

Both rate each other.

## 11. Current MVP Priority

Highest priority:

1. Authentication
2. Profiles
3. Skills
4. Request board
5. Offer/accept
6. Swap
7. Messaging
8. SkillCredits
9. Ratings

Only after these work:
- Smart matching
- Recommendations
- Leaderboards
- Advanced notifications
- Analytics

## 12. Team Ownership

### Person 1
Frontend + design system + profiles/dashboard

### Person 2
Backend + database + auth + SkillCredits

### Person 3
Marketplace + requests + offers + matching

### Person 4
Messaging + notifications + ratings + integration/testing

## 13. Coding Assistant Context

When modifying the project:

- Read `prd.md` first for product requirements.
- Read `architecture.md` before architectural changes.
- Follow `rules.md` for engineering decisions.
- Follow `phases.md` to understand current development stage.
- Follow `design.md` for UI decisions.
- Read `memory.md` to understand the product context.

Do not invent major requirements that conflict with these files.

## 14. Decision Hierarchy

If documents conflict:

1. Current agreed team decision
2. `prd.md`
3. `architecture.md`
4. `rules.md`
5. `design.md`
6. `memory.md`

If an implementation decision is ambiguous, choose the simplest solution that keeps the MVP working and document the decision.

## 15. Hackathon North Star

**Make one complete skill exchange work extremely well before adding more features.**
