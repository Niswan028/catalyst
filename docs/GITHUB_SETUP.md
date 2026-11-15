# GitHub Repository Setup & Metadata Guide

## Repository Description Suggestion
> An elderly-first medication & healthcare management platform with secure passcode-based family circles, proactive multi-tier email reminders, doctor appointments with .ics calendar export, and WCAG 2.1 AA accessible "Easy Mode".

## Suggested Repository Topics (Tags)
```text
healthcare, elderly-care, medication-management, accessibility, wcag-2-1-aa, nextjs14, typescript, tailwindcss, supabase, pwa, email-reminders, family-care-circle, hackathon, catalyst2026, promptwars
```

## Recommended Repository Settings
1. **Default Branch**: `main`
2. **Branch Protection**:
   - Require status checks to pass before merging:
     - `Lint & Typecheck`
     - `Unit & Integration Tests (vitest)`
     - `Production Build (Next.js)`
   - Require branches to be up to date before merging
3. **GitHub Secrets**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (Optional for production email dispatch)
4. **Social Preview**:
   - Set social preview image pointing to the platform hero with Eleanor Vance's Easy Mode and Vance Family Care Circle.
