# Contributing to CareConnect

Thank you for contributing to CareConnect, an accessible, elder-centric medication management and care coordination platform.

---

## 1. Architecture & Directory Conventions

CareConnect follows a modular feature and domain-driven directory structure:

```
├── app/                  # Next.js 14 App Router pages and API routes
│   ├── api/              # Secure JSON REST APIs with Zod validation
│   ├── appointments/     # Doctor appointments view & scheduling
│   ├── auth/             # Sign-in, sign-up, and OAuth callback handlers
│   ├── caregiver/        # Caregiver multi-elder monitoring portal
│   ├── checkin/          # Voice and accessible text daily health check-in
│   ├── dashboard/        # Elderly patient calm dashboard
│   ├── medications/      # Prescription management
│   └── messages/         # Voice note and care circle audio messages
├── components/           # Presentational, reusable UI components (PascalCase)
│   ├── appointments/     # Appointment modal forms and cards
│   ├── caregiver/        # Caregiver tab views & member sidebar
│   ├── checkin/          # Voice, text alternative, and history cards
│   ├── circles/          # Family care circle members, passcodes, audit
│   ├── dashboard/        # Dashboard hero, timeline, next dose focus
│   ├── medications/      # Medication forms and schedule cards
│   └── ui/               # Core atomic primitives (Button, Card, Badge, Stat)
├── hooks/                # Custom React hooks (camelCase prefixed with use*)
├── lib/                  # Shared core infrastructure & utilities
│   ├── api/              # withAuth and withRole middleware wrappers
│   ├── auth/             # Secure cookie helpers & session management
│   ├── email/            # Resend/SMTP email engine, schedulers, and templates
│   ├── supabase/         # Typed client and server Supabase factories
│   ├── constants.ts      # Immutable configuration constants
│   ├── date.ts           # Unified date & time formatting
│   ├── errors.ts         # Standardized error hierarchy & formatters
│   ├── permissions.ts    # Role-based resource permission rules
│   └── types.ts          # Strict TypeScript discriminated unions & schemas
├── supabase/             # Database migrations & SQL schema
└── __tests__/            # Comprehensive Vitest unit, boundary, and live tests
```

---

## 2. Naming & Coding Standards

1. **Components**: PascalCase (e.g., `TodayDoseTimeline.tsx`, `CaregiverUserSidebar.tsx`).
2. **Hooks**: camelCase starting with `use` (e.g., `useDashboardData.ts`, `useFamilyCircle.ts`).
3. **Utilities**: camelCase (e.g., `formatDateTime`, `checkRateLimit`).
4. **Single-Responsibility Principle**: Keep components presentational (<200 lines). Extract state, mutations, and side effects into custom hooks or services.
5. **Strict TypeScript**:
   - Zero `any` types.
   - Use discriminated unions for status fields (`'taken' | 'skipped' | 'missed'`, `'pending' | 'approved' | 'revoked'`).
   - Use `unknown` with `getErrorMessage(err)` in catch blocks.

---

## 3. Development Workflow & Verification Gates

Before submitting any commit or pull request, ensure all gates pass with zero errors and zero warnings:

```bash
# 1. Run ESLint across all source files
npm run lint

# 2. Run TypeScript strict typecheck
npm run typecheck

# 3. Run full Vitest test suite
npm test

# 4. Run test coverage audit
npm run test:coverage

# 5. Build production bundle (28/28 routes must compile)
npm run build
```

---

## 4. Security & Privacy Rules

- **Zero Committed Secrets**: Never commit `.env` or `.env.local` files. Keep credentials in environment variables only.
- **Passcode Security**: Never log or store raw passcodes in database tables. Passcodes are hashed with bcrypt/argon2 and verified in constant time.
- **RLS Enforced**: Every Supabase table must have Row-Level Security enabled with explicit tenant isolation policies.
- **Input Validation**: Every API route must validate JSON payloads with Zod before processing.
