# SkillSwap — Project Rules

## 1. Purpose

These rules are the source of truth for how the SkillSwap codebase should be built and maintained.

## 2. Product Rules

1. SkillSwap is campus-focused.
2. SkillCredits are virtual credits, not real currency.
3. No real-money transactions in the MVP.
4. Every completed exchange must have a corresponding transaction.
5. Users should be able to both offer and request skills.
6. Trust and reputation are core product features.
7. The complete swap loop has priority over secondary features.

## 3. Engineering Rules

1. Use TypeScript where supported.
2. Prefer reusable components.
3. Avoid duplicated business logic.
4. Keep business logic out of purely presentational components.
5. Use meaningful names.
6. Keep functions small and focused.
7. Do not introduce a dependency unless it provides clear value.
8. Do not rewrite working architecture without team agreement.
9. Do not commit secrets, API keys, or credentials.
10. Use environment variables for configuration.

## 4. Git Rules

Use feature branches.

Suggested naming:
- feature/auth
- feature/profile
- feature/requests
- feature/messaging
- feature/wallet
- fix/description
- chore/description

Commit examples:
- feat: add request creation flow
- feat: add swap completion
- fix: prevent duplicate credit transfer
- ui: improve request board

Before merging:
- Pull latest changes.
- Resolve conflicts locally.
- Test affected functionality.
- Confirm the application starts successfully.

## 5. UI Rules

1. Keep navigation consistent.
2. Use one design system across all screens.
3. Use consistent spacing.
4. Use consistent button styles.
5. Every page needs a useful loading state where data loads asynchronously.
6. Every data-heavy page needs an empty state.
7. Forms must show validation errors clearly.
8. Avoid unnecessary animations.
9. Mobile responsiveness is required.
10. Do not sacrifice usability for visual effects.

## 6. UX Rules

Use clear primary actions.

Examples:
- **Post a Request**
- **Offer Help**
- **Accept Offer**
- **Start Chat**
- **Complete Swap**

Avoid vague labels such as:
- "Proceed"
- "Continue"
- "Submit" when a more specific label exists.

## 7. Database Rules

1. IDs should be unique.
2. Use timestamps for important records.
3. Use foreign keys where appropriate.
4. Do not store duplicated derived data unless justified.
5. Protect private messages.
6. Protect transaction records.
7. Credit balance must never be directly editable by the client.

## 8. SkillCredit Rules

1. New users may receive a fixed starting balance.
2. Credits are earned by completing swaps.
3. Credits are spent by requesting help.
4. Credits move only through authorized server-side operations.
5. Every movement has a transaction record.
6. A completed swap cannot be paid twice.
7. Users cannot transfer arbitrary credits to themselves.
8. Real-money conversion is not supported.

## 9. Messaging Rules

1. Users can message only within an authorized swap/conversation.
2. Messages must have a sender.
3. Messages must have a timestamp.
4. Do not expose unrelated conversations.
5. Show an appropriate empty state when no messages exist.

## 10. Rating Rules

1. Rating is available after a completed swap.
2. A user cannot rate themselves.
3. A user should not submit multiple ratings for the same completed interaction unless the product explicitly supports editing.
4. Ratings should not be used to harass users.
5. Display average rating only when enough information exists.

## 11. AI/Code Generation Rules

If an AI coding assistant is used:

- Read existing files before changing them.
- Follow this repository's architecture.
- Do not create duplicate components.
- Do not silently change database structure.
- Explain significant architectural changes.
- Preserve existing functionality.
- Prefer the smallest working change.
- Test after significant changes.

## 12. Definition of Done

A feature is complete only when:

- UI exists.
- Required backend/data logic exists.
- Authorization is handled.
- Loading state exists where needed.
- Error state exists where needed.
- Basic responsive behavior works.
- Happy path has been tested.
- Existing functionality still works.

## 13. Hackathon Priority Rule

If time becomes limited:

### Priority 1
Authentication

### Priority 2
Profiles + skills

### Priority 3
Request board

### Priority 4
Offer/accept flow

### Priority 5
Messaging

### Priority 6
SkillCredits

### Priority 7
Ratings

### Priority 8
Visual polish and advanced matching

A beautiful UI with a broken exchange flow is not considered a successful MVP.
