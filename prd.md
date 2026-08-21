# SkillSwap — Product Requirements Document

## 1. Project Overview

**Project:** SkillSwap — Campus Skills Marketplace  
**Type:** Campus-local peer-to-peer web platform  
**Primary goal:** Help students exchange skills and knowledge using virtual SkillCredits instead of real money.

### Core idea

Students can:
1. Create a profile.
2. List skills they can offer.
3. List skills they need.
4. Post requests on a public campus bulletin board.
5. Discover suitable students.
6. Start an instant conversation.
7. Complete a skill exchange.
8. Transfer virtual SkillCredits.
9. Rate the experience.

## 2. Problem Statement

College students frequently need quick help with coding, mathematics, design, video editing, presentations, writing, languages, and other tasks. Professional services may be too expensive or unnecessarily formal.

At the same time, students possess useful skills that other students need but have no simple campus-specific mechanism for exchanging those skills.

SkillSwap creates a trusted campus marketplace where students exchange knowledge through a virtual credit economy.

## 3. Target Users

### Student who needs help
Needs a fast and affordable way to find another student with the required skill.

### Student who offers help
Wants to use their skills, help peers, build reputation, and earn SkillCredits.

### Student who does both
Most users will both earn and spend credits.

## 4. MVP Scope

### Must Have

- Student registration/login
- Student profile
- Skills offered
- Skills needed
- Skill search/discovery
- Public request board
- Create/edit/delete own requests
- Request details
- Offer to help
- Accept/decline an offer
- One-to-one messaging
- SkillCredit balance
- Credit transaction history
- Swap completion
- Rating/reputation
- Basic notifications
- Responsive web UI

### Should Have

- Skill categories
- Skill levels
- Availability
- Smart match score
- Campus/department filters
- Request status filters
- Profile verification indicator

### Could Have

- Suggested matches
- Skill recommendations
- Saved requests
- Report/dispute flow
- Leaderboard
- Campus analytics

### Out of Scope for MVP

- Real-money payments
- Cash withdrawal
- Public social feed
- Complex AI chatbot
- Video calling
- Native mobile applications
- Multi-campus federation
- Advanced administrator analytics

## 5. Core User Journey

### A. Need Help

1. Student logs in.
2. Student searches for a skill or opens the request board.
3. Student creates a request.
4. Student specifies description, desired skill, deadline, and SkillCredit reward.
5. Other students see the request.
6. A student offers help.
7. Request owner accepts the offer.
8. A private conversation becomes available.
9. Students coordinate.
10. Request owner marks the swap completed.
11. Credits are transferred.
12. Both students can rate the interaction.

### B. Offer Help

1. Student views a request.
2. Student clicks **Offer Help**.
3. Student sends an optional message.
4. Request owner accepts.
5. Swap enters active state.
6. Students coordinate through chat.
7. Swap is completed.
8. Provider receives credits.
9. Reputation is updated.

## 6. SkillCredit Economy

SkillCredits are virtual platform credits only.

Suggested initial balance:
- New verified student: 20 credits

Example reward ranges:
- Small task: 5 credits
- Medium task: 10 credits
- Large task: 15–20 credits

Rules:
- Credits cannot be converted to real money.
- Credits are transferred only after completion confirmation.
- Users cannot manually create credits.
- Every transfer creates a transaction record.
- Negative balances should not be allowed unless explicitly supported by the team.

## 7. Functional Requirements

### Authentication
- Student can register.
- Student can log in/out.
- Student session remains authenticated.
- User account has a unique ID.
- Prefer institutional email verification for the hackathon demo.

### Profiles
- Name
- Profile photo/avatar
- College
- Department
- Year
- Bio
- Skills offered
- Skills needed
- Availability
- SkillCredit balance
- Rating
- Completed swaps

### Requests
Each request should contain:
- Title
- Description
- Required skill
- Skill category
- Credits offered
- Deadline
- Creator
- Status
- Created date

Statuses:
- Open
- In Progress
- Completed
- Cancelled

### Messaging
- Only authenticated users can send messages.
- Conversations are associated with a swap/request.
- Messages show sender, content, and timestamp.
- Users should not be able to message blocked/removed users.

### Transactions
Every credit transfer records:
- Transaction ID
- Sender
- Receiver
- Amount
- Reason
- Related swap
- Timestamp

## 8. Non-Functional Requirements

- Responsive on desktop, tablet, and mobile.
- Clear navigation.
- Accessible text contrast and readable typography.
- Loading and empty states for important screens.
- Basic form validation.
- User-friendly error messages.
- No secrets exposed in frontend code.
- Database operations must validate ownership and authorization.
- Critical credit operations should be atomic.

## 9. Main Screens

1. Landing/Login
2. Sign Up
3. Dashboard
4. Discover Skills
5. Request Board
6. Request Details
7. Create Request
8. Profile
9. Edit Profile
10. Messages
11. Wallet / SkillCredits
12. Transaction History
13. Notifications
14. Swap Details

## 10. Success Criteria

The hackathon MVP is successful if a judge can:

1. Register/login.
2. Create a profile.
3. Add a skill.
4. Create a help request.
5. Find the request from another account.
6. Offer help.
7. Accept the offer.
8. Send messages.
9. Complete the swap.
10. See the SkillCredits transfer.
11. Leave a rating.

## 11. Demo Scenario

Use a simple demo:

> Priya needs help debugging a React project and offers 10 SkillCredits.

> Aarav has React skills and offers help.

> Priya accepts Aarav.

> They exchange messages.

> Priya marks the task completed.

> Aarav receives 10 SkillCredits.

> Both users rate the experience.

This single scenario should demonstrate the complete product loop.

## 12. Product Principle

**SkillSwap should feel like a trusted campus community, not a generic freelance website.**
