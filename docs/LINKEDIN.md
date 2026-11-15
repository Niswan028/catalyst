# CareConnect: LinkedIn Post & Launch Support Material

## 1. LinkedIn Post Text

Every year, over 100,000 preventable deaths and billions in avoidable hospital readmissions occur due to medication non-adherence among elderly adults. 

Most reminder apps fail because they either:
1. Isolate the senior without a reliable safety net when a dose is missed, or
2. Strip the senior of their autonomy with patronizing, complex interfaces that exclude them from their own care.

For Round 2 of Catalyst 2026, I built **CareConnect** — a smart, interconnected elderly care and medication management platform designed to place the elder at the center of their healthcare decisions.

🚀 **Live Production Platform**: https://careconnectcatalyst.netlify.app/
📂 **GitHub Repository**: https://github.com/Niswan028/catalyst

### 💡 What CareConnect Delivers:
- 👵 **Elder Sovereignty & "Easy Mode"**: 32px targets, 12:1+ high-contrast mode, single-tap "I Took It" logging, and Web Speech voice announcements tailored for seniors.
- 🔑 **Passcode-Based Family Care Circles**: Elders generate secure, expiring passcodes (e.g., `CARE-2026`) so family members and doctors can join. Elders hold sovereign approval gates before any health data is visible.
- 🔔 **Proactive Multi-Tier Email Escalations**: Automated reminders for upcoming doses, +15 minute caregiver warnings, and +60 minute urgent escalations to the entire care circle.
- 🗓️ **Doctor Appointments & RFC 5545 .ics Calendar Export**: Schedule clinical visits with 24-hour and 2-hour email countdowns and 1-click sync to Apple, Google, and Outlook calendars.
- 📊 **Rule-Based Adherence Insights & Refill Forecasts**: Days-to-depletion forecasting with low-stock alerts, adherence trends over time, and a time-slot heatmap with rule-based suggestions (with non-medical advice disclaimers).
- 🌐 **Multi-Lingual & Certified Accessibility**: Built strictly to **WCAG 2.1 AA** with keyboard navigation, aria-live status updates, zero axe violations, and native English, Hindi (हिन्दी), and Tamil (தமிழ்) support.

### 🛠️ Tech Stack:
Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL with strict Row Level Security), Nodemailer (with resilient dev-mock fallback), Vitest (120 unit/integration tests), and axe-core.

*CareConnect began from the open-source CareConnect project by S4DIB (https://github.com/S4DIB/careconnect), and was re-architected with family passcode circles, proactive email escalations, appointment management, and accessibility enhancements.*

A huge thank you to @Makers Need More (MnM) and @PromptWars for hosting such an impactful challenge!

#Catalyst2026 #MakersNeedMore #MnM #HealthcareInnovation #Accessibility #A11y #ElderlyCare #NextJS #TypeScript #OpenSource #Supabase

---

## 2. Five Screenshots to Capture

1. **Screenshot 1: The Elder Dashboard & Today Schedule**
   - **Route**: `/dashboard`
   - **Persona**: Eleanor Vance (Elder)
   - **State to Show**: Time-of-day greeting ("Good afternoon, Eleanor!"), Next Dose card with live countdown ("Due in 42 minutes"), Today's Dose Timeline with large "Taken" (green) and "Skip" buttons, and the 96% Adherence ProgressRing.

2. **Screenshot 2: Accessible "Easy Mode" in Action**
   - **Route**: `/dashboard` (with Easy Mode toggled ON)
   - **State to Show**: High-contrast 32px-48px typography, giant "I Took It" button, simplified one-task view, and spoken audio prompt indicator.

3. **Screenshot 3: Family Care Circle & Passcode Approval Gate**
   - **Route**: `/dashboard` -> Open "Family Care Circle" Modal
   - **State to Show**: Active invite passcode `CARE-2026` with countdown expiry, list of members (Marcus Vance as Editor, Dr. Anita Patel as Clinician), and David Vance in "PENDING APPROVAL" status highlighting elder-controlled sovereignty.

4. **Screenshot 4: Adherence Insights & Time-Slot Heatmap**
   - **Route**: `/dashboard` -> Adherence Insights & Refill Widget
   - **State to Show**: 7-day adherence trend chart, 4-period time slot heatmap (Morning, Noon, Evening, Bedtime) with the yellow warning on midday doses, and the prominent "Not medical advice" disclaimer.

5. **Screenshot 5: Doctor Appointments & 1-Click .ics Export**
   - **Route**: `/appointments`
   - **State to Show**: Scheduled consultation with Dr. Anita Patel (Geriatric Cardiology) at Metro Health Hospital with status badge, notes, and the "📅 Export .ics" button.

---

## 3. 60-Second Video Demo Script

- **[0:00 - 0:10] The Problem**:
  "Over 100,000 seniors suffer preventable hospitalizations every year simply because traditional reminder apps isolate them or patronize them. Meet CareConnect: an elderly-centric care platform where seniors lead their own healthcare."

- **[0:10 - 0:25] Elder Autonomy & Easy Mode**:
  "Logged in as 75-year-old Eleanor Vance. Her dashboard greets her by name, shows her upcoming Lisinopril dose with a live countdown, and lets her switch to 'Easy Mode' with a single tap: huge 32-pixel text, spoken voice reminders, and an unmistakable 'I Took It' button."

- **[0:25 - 0:40] Passcode Circles & Elder Sovereignty**:
  "Instead of tedious email invites, Eleanor creates a secure 7-day passcode: CARE-2026. Her son Marcus joins, and Eleanor reviews and approves him as an Editor. Every member's permissions are granularly controlled by Eleanor, with an immutable audit log tracking every access."

- **[0:40 - 0:52] Proactive Email Escalation & Appointments**:
  "If Eleanor misses a dose, CareConnect doesn't just buzz her phone. It sends a proactive email reminder at 15 minutes, and escalates to Marcus and her doctor at 60 minutes. Her doctor appointments sync directly to Apple and Google Calendars with one click."

- **[0:52 - 1:00] Conclusion**:
  "Fully accessible, WCAG 2.1 AA certified, with English, Hindi, and Tamil support. CareConnect brings family peace of mind while keeping elders independent. Try it live at careconnectcatalyst.netlify.app."
