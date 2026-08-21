# SkillSwap — Design System

## 1. Design Direction

SkillSwap should feel:

- Friendly
- Student-focused
- Modern
- Trustworthy
- Collaborative
- Lightweight
- Campus-native

Avoid making it look like a corporate banking app or a generic freelance marketplace.

## 2. Visual Concept

Primary concept:

**Campus community + digital marketplace**

Use cards, rounded surfaces, clear skill tags, friendly avatars, concise information, and visible SkillCredit balances.

## 3. Color System

Use a simple semantic palette.

### Primary
A confident blue/purple family for major actions and brand identity.

### Secondary
A supportive green family for successful exchanges and earned credits.

### Warning
Amber/orange for deadlines or attention states.

### Error
Red for destructive/error states.

### Neutral
White/light neutral surfaces with dark readable text.

Do not use excessive gradients.

## 4. Typography

Use a clean modern sans-serif.

Recommended:
- Inter
- Geist
- system sans-serif fallback

Hierarchy:

### H1
Large and bold.

### H2
Section heading.

### H3
Card/title heading.

### Body
Readable, approximately 15–16px.

### Caption
12–14px for metadata.

## 5. Spacing

Use a consistent spacing scale.

Suggested:
- 4px
- 8px
- 12px
- 16px
- 24px
- 32px
- 48px
- 64px

Avoid arbitrary spacing values unless necessary.

## 6. Border Radius

Use moderately rounded corners.

- Buttons: 10–12px
- Cards: 14–18px
- Inputs: 10–12px
- Avatars: circular

Avoid extreme pill styling for every component.

## 7. Main Navigation

Desktop:

```text
SkillSwap

Dashboard
Discover
Requests
Messages

                    🔔    Credits    Profile
```

Mobile:
- Use a compact top bar.
- Use bottom navigation if appropriate.

## 8. Dashboard

Recommended structure:

```text
Good morning, Student 👋

[ SkillCredits: 35 ] [ Completed: 12 ] [ Rating: 4.8 ]

What do you need help with?
[ Search skills... ]

Quick actions:
[ Post a Request ] [ Offer a Skill ]

Recommended for you
--------------------------------
Request cards

Your active swaps
--------------------------------
Active swap cards
```

## 9. Request Card

Each request card should show:

- Request title
- Required skill
- Short description
- Credits
- Deadline
- Student avatar/name
- Department/year
- Status
- Primary action

Example:

```text
Need help debugging React auth

React · Intermediate

"Getting an auth error in my project..."

10 SkillCredits
Due tomorrow

[ View Request ]
```

## 10. Profile Card

Show:

- Avatar
- Name
- Department/year
- Rating
- Completed swaps
- Skills offered
- Skills wanted
- Credit balance

## 11. Skill Tags

Example:

`React` `Python` `Figma` `Video Editing`

Skill tags should be visually distinct but compact.

## 12. Credit Display

Use a consistent icon or label:

**◎ 25 SkillCredits**

Do not visually imply that credits are real currency.

## 13. Chat UI

Conversation layout:

```text
--------------------------------
< Back     Aarav
          React · Active Swap
--------------------------------

Aarav:
Hey! I can help debug this.

You:
Great! Are you free at 6?

Aarav:
Yes 👍

--------------------------------
[ Type a message... ] [ Send ]
```

Keep chat simple.

## 14. Status Labels

Use semantic statuses:

- Open
- Pending
- Active
- Completed
- Cancelled

Make status visually recognizable without relying only on color.

## 15. Empty States

Example:

### No requests

> No requests yet  
> Be the first student to ask for help.

[ Post a Request ]

### No messages

> Your conversations will appear here after you join a swap.

## 16. Loading States

Use skeletons for:
- Request cards
- Profile
- Messages
- Dashboard statistics

Avoid showing blank screens.

## 17. Responsive Rules

### Mobile
- Single-column layouts
- Large touch targets
- Collapsible filters
- Simplified navigation

### Tablet
- Two-column cards where appropriate

### Desktop
- Maximum content width
- Sidebar/filter options where useful
- Multi-column dashboard

## 18. Accessibility

- Keyboard-friendly controls
- Visible focus states
- Good text contrast
- Labels for inputs
- Alt text for meaningful images
- Do not rely on color alone for status

## 19. Design Rule

Every screen should answer:

1. Where am I?
2. What can I do here?
3. What should I do next?

The primary action should always be obvious.
