# CareConnect 3-Minute Live Demo Script

This script guides hackathon evaluators and live presenters through a complete 3-minute end-to-end demonstration of the CareConnect platform.

---

## ⏱️ Demo Overview Timeline

| Timestamp | Segment | Key Feature Demonstrated |
|-----------|---------|-------------------------|
| **0:00 - 0:45** | Act 1: The Elder Experience & Easy Mode | Modern Dashboard Hero, One-Tap Dose Confirmation, Speech Synthesis |
| **0:45 - 1:30** | Act 2: Passcode Family Care Circle | 6-Character Hashed Invite Passcode, Elder Approval Gate, Privacy Toggles |
| **1:30 - 2:15** | Act 3: Proactive Multi-Tier Email Escalation | Interactive Email Dispatcher, +15m Alert, +60m Urgent Escalation, Weekly Digest |
| **2:15 - 2:45** | Act 4: Doctor Appointments & .ics Export | Upcoming Appointments Widget, 1-Click .ics Calendar Export with Alarms |
| **2:45 - 3:00** | Act 5: Smart Adherence & Refill Forecasts | Adherence Pattern Detector, Refill Depletion Timeline, Medical Disclaimer |

---

## 🔑 Demo Credentials

- **Elder Account**: `eleanor.vance.demo@gmail.com` / `Password123!Secure`
- **Caregiver Account**: `marcus.caregiver.demo@gmail.com` / `Password123!Secure`
- **Live Local URL**: `http://localhost:3000`

---

## 🎬 Step-by-Step Walkthrough

### Act 1: The Elder Experience & Easy Mode (0:00 - 0:45)
1. **Navigate to `http://localhost:3000/auth/signin`**:
   - Log in with Eleanor Vance's credentials (`eleanor.vance.demo@gmail.com` / `Password123!Secure`).
2. **Observe the Calm Healthcare Dashboard**:
   - Note the Hero Banner with Eleanor's personalized greeting and real-time synchronization indicators.
   - Note the Quick Stats KPI row: Active Prescriptions, Next Dose countdown, Today's Check-in status, and Adherence Rate ProgressRing.
3. **Toggle "Easy Mode"**:
   - Click the **`👓 Easy Mode`** button in the header.
   - Observe the transformation to ultra-large typography (32px-48px), high contrast (12:1+), and zero visual distractions.
   - Click **`🔊 Read Aloud to Me`** to trigger Web Speech Synthesis reading Eleanor's dose aloud.
   - Click the large green **`💊 I Took My Dose`** button. Listen to the audible confirmation chime and voice confirmation (*"Dose confirmed for Lisinopril"*).
   - Click **`✕ Exit Easy Mode`** to return to standard view.

---

### Act 2: Passcode-Based Family Care Circles (0:45 - 1:30)
1. **Open Family Care Circle**:
   - Click the **`👥 Family Care Circle`** button in the header.
2. **Review Circle Members**:
   - Note Eleanor Vance listed as **Owner**.
   - Note Marcus Vance listed as **Approved Editor**.
   - Toggle Eleanor's privacy permissions per member (e.g. toggle whether Marcus can see audio check-ins or medication logs).
3. **Generate an Expiring Invite Passcode**:
   - Switch to the **`Invite New Member`** tab.
   - Select Role: `Editor` or `Viewer`.
   - Set Expiration: `48 Hours`. Set Uses: `1 Use`.
   - Click **`Generate Passcode`**.
   - Observe the 6-character clean alphanumeric code (e.g. `K7M9P2`).
   - *Technical highlight to judges: Passcode is hashed using salted bcrypt rounds=10 before storage; rate limited to 5 failures per 15 min; raw passcodes are never stored.*

---

### Act 3: Proactive Multi-Tier Email Escalation (1:30 - 2:15)
1. **Launch Proactive Email Dispatcher**:
   - Click the **`🔔 Test Reminders`** button in the dashboard hero.
2. **Demonstrate 2-Stage Escalation**:
   - Select **`⚠️ Missed Dose Alert (Level 1: +15m)`**:
     - Explaining that if Eleanor misses a dose by 15 minutes, a friendly check-in email alerts Eleanor and designated caregivers.
     - Click **`🚀 Trigger Notification`**. Observe instant success toast with Message ID.
   - Select **`🚨 Missed Dose ESCALATION (Level 2: +60m)`**:
     - Explaining that if the medication remains untaken after 1 hour, urgency escalates to all family circle editors and viewers.
     - Click **`🚀 Trigger Notification`**. Observe urgent escalation dispatch.
3. **Demonstrate Weekly Care Digest**:
   - Select **`📊 Weekly Family Circle Digest`** and trigger.
   - Explaining that family members receive weekly adherence percentages, streak metrics, and upcoming appointment counts.

---

### Act 4: Doctor Appointments & .ics Calendar Export (2:15 - 2:45)
1. **Observe Upcoming Appointments Widget**:
   - View Dr. Sarah Jenkins (Cardiology) scheduled at City General Hospital, Suite 302.
   - View Dr. Robert Chen (Ophthalmology) scheduled at Mercy Eye Clinic.
2. **1-Click .ics Export**:
   - Click the **`🗓️ Export .ics`** button.
   - Observe that an RFC 5545 compliant `.ics` calendar file downloads instantly.
   - *Technical highlight to judges: The `.ics` file includes built-in 24-hour and 2-hour alarm triggers that sync directly with Apple Calendar, Google Calendar, and Outlook.*

---

### Act 5: Smart Adherence Insights & Refill Forecasts (2:45 - 3:00)
1. **Examine Adherence Insights Card**:
   - Point out the circular SVG `ProgressRing` displaying 92% adherence.
   - Note the **Schedule Pattern Detector**:
     - *"⚠️ Frequently missed time slot: 12:30 PM (14% missed)"*.
     - *"💡 Suggestion: Consider setting a reminder aligned with your midday lunch routine."*
   - Point out the mandatory medical disclaimer: *"Rule-based adherence insight only. Not medical advice."*
2. **Examine Refill Forecast Widget**:
   - Observe Atorvastatin flagged as critically low (5 doses remaining, threshold 7).
   - Point out predicted depletion in 5 days, prompting a 1-click pharmacy refill request.

---

## 🎯 Wrap-Up Pitch to Judges (10 Seconds)
> *"CareConnect is not just another reminder app. It is a secure, collaborative, accessible healthcare ecosystem that gives family members peace of mind while keeping the elderly person firmly at the center of their own healthcare decisions."*
