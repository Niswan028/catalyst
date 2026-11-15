# CareConnect Round 2 Execution Plan & Checklist

## Phase 0: Baseline Verification

### Real Command Outputs (Initial Run)
- **`npm run lint`**:
  ```text
  > care-connect@0.1.0 lint
  > next lint

  ✔ No ESLint warnings or errors
  ```
- **`npm run typecheck`**:
  ```text
  > care-connect@0.1.0 typecheck
  > tsc --noEmit
  (exit code 0 - No TypeScript compilation errors)
  ```
- **`npm test`**:
  ```text
  Test Files  18 passed (18)
       Tests  119 passed (119)
    Duration  4.33s
  ```
- **`npm run build`**:
  ```text
  ✓ Compiled successfully
  ✓ Generating static pages (28/28)
  (exit code 0 - Optimized production build successful)
  ```

### Actual Routes and Pages
- **Client Pages**:
  - `/` (Landing Page & Hero)
  - `/_not-found` (404 Not Found Page)
  - `/appointments` (Doctor Appointments CRUD & .ics export)
  - `/auth/signin` (Authentication & 1-Click Demo Profiles)
  - `/auth/signup` (Registration with Role Selection)
  - `/auth/callback` (OAuth & Session Synchronization)
  - `/caregiver` (Caregiver / Clinician Oversight Dashboard)
  - `/checkin` (Elder Daily Health Check-in: Voice & Text)
  - `/dashboard` (Elder Central Management & Easy Mode)
  - `/medications` (Prescription Schedule & Dose Logging)
  - `/messages` (Care Circle Messaging & Audio Check-ins)
  - `/settings` (Preferences, Language, Notifications, Font Size)
  - `/audit` (Care Circle Audit Log & Access Trail)
  - `/demo` (Judge Tour & Demo Guide Panel)
  - `/health` (Health Check Endpoint)

- **API Routes**:
  - `/api/auth/signin`
  - `/api/auth/signup`
  - `/api/circles`
  - `/api/circles/[id]/audit`
  - `/api/circles/[id]/invites`
  - `/api/circles/[id]/members`
  - `/api/circles/join`
  - `/api/medications`
  - `/api/medications/log`
  - `/api/appointments`
  - `/api/appointments/[id]`
  - `/api/appointments/[id]/ics`
  - `/api/caregiver/adherence`
  - `/api/caregiver/alerts`
  - `/api/caregiver/checkins`
  - `/api/caregiver/links`
  - `/api/caregiver/medications`
  - `/api/checkin`
  - `/api/messages`
  - `/api/summary`
  - `/api/adherence/insights`
  - `/api/cron/reminders`
  - `/api/cron/test-reminder`
  - `/api/demo/seed`
  - `/api/health`

---

## Detailed Checklist by Phase

### Phase 0: Baseline
- [x] Run lint, typecheck, tests, and build, and report actual output
- [x] List actual routes and pages
- [x] Write `docs/ROUND2_PLAN.md` with checklist

### Phase 1: Functionality (20%)
- [x] Sign up and sign in for each role (elder, caretaker, family) with clear validation
- [x] Passcode flow: elder generates passcode with expiry & max uses, family member joins via UI, elder approves/rejects, roles (viewer/editor) enforced, elder can revoke access
- [x] Medications: add, edit, delete, flexible schedules, stock & refill alerts, dose logging (taken, skipped, missed), adherence shows "No data yet" when no doses exist
- [x] Appointments: add, edit, cancel, upcoming list, .ics calendar export
- [x] Email reminders: upcoming dose, missed dose (with escalation chain to family), appointments, idempotent, logged in audit/notification logs, clearly labelled "Send test reminder" action
- [x] Messages and voice check-ins work; every empty, loading, and error state is handled
- [x] Seed data & "Load demo data" 1-click action for judges + demo login for each role on sign-in page

### Phase 2: UI/UX (15%)
- [x] Design system tokens in `tailwind.config.ts` and CSS variables (warm primary, warm accent, soft neutral surfaces, semantic colors: taken green, upcoming blue, missed red, pending amber with icons + text labels)
- [x] Typography: legible font pairing via `next/font`, base size 18px, strong hierarchy, generous line height
- [x] Component library in `components/ui` (Button, Card, Badge, Input, Select, Dialog, Toast, Tabs, Skeleton, EmptyState, Avatar, ProgressRing, Stat, Timeline)
- [x] Layout: mobile-first responsive design, bottom navigation on mobile, clean side/top nav on desktop (tested at 360px, 768px, 1280px)
- [x] Landing page: polished hero explaining problem and solution, key features, 3-step guide, clear sign-in and demo buttons
- [x] Dashboard hero "Today" view: time-of-day greeting, timeline of today's doses with large Taken & Skip buttons, next-dose countdown, adherence ProgressRing, upcoming appointments, family activity feed
- [x] Polish screens: sign in/up, 3-step onboarding, Medications, Appointments, Family Care Circle, Insights, Messages, Settings, Audit log
- [x] Easy Mode: extra-large text, high contrast, one task per screen, big one-tap "I took it", simplified navigation
- [x] Dark mode and high-contrast mode: saved per user with no flash on load
- [x] English, Hindi, and Tamil translations for key screens and email templates
- [x] Micro-interactions: subtle transitions, gentle dose-logged success animation, skeleton loaders, optimistic updates with rollback and toast feedback, respect `prefers-reduced-motion`
- [x] Friendly empty and error states with icons and clear next action
- [x] PWA: manifest, icons, installable, offline-friendly shell
- [x] Accessibility: WCAG 2.1 AA (semantic landmarks, visible focus, keyboard nav, 4.5:1 contrast, 44px touch targets, labeled inputs, aria-live), axe audit

### Phase 3: Implementation & Problem-Solution Alignment (40%)
- [x] Requirement-to-feature mapping table at the top of README (Requirement | Feature | Where to see it in the app)
- [x] Visible differentiators: elder-controlled sharing permissions, missed-dose escalation chain, adherence pattern detection with schedule suggestions ("not medical advice" note), refill predictions, weekly family digest email, audit log
- [x] Strict TypeScript, no `any`, zero lint warnings, unit/integration tests for core logic and API routes

### Phase 4: Deployment & Completeness (10%)
- [x] Netlify production build check & `.env.local.example` documented
- [x] `/health` route, custom 404 page, custom error page, metadata & favicons
- [x] Production email configuration docs & Netlify scheduled function / cron docs
- [x] "Demo guide" page or panel with test accounts and 5-step tour for judges

### Phase 5: GitHub Repository (5%)
- [x] Clean root: README.md, LICENSE note, .env.local.example, CONTRIBUTING.md, SECURITY.md, docs/ (ENDPOINTS.md, ARCHITECTURE.md, DEMO.md, screenshots). Delete stale/duplicate files.
- [x] README: problem, solution, requirement-to-feature table, screenshots, mermaid diagram, tech stack, setup steps, tests, live demo link, CI badge, S4DIB Acknowledgements
- [x] `docs/GITHUB_SETUP.md` with repo topics and description

### Phase 6: LinkedIn Support Material (10%)
- [x] `docs/LINKEDIN.md` with post text, tags (@Makers Need More (MnM), PromptWars, #Catalyst2026 #MakersNeedMore #MnM), S4DIB credit, 5 screenshot specs, 60s demo-video script
