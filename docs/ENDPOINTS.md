# CareConnect API Endpoint Specification & Audit

This document provides a complete audit and reference specification of all 22 REST API endpoints in the CareConnect platform. All endpoints enforce strict TypeScript types, server-side authentication, role authorization, Zod schema validation, and uniform JSON response envelopes.

---

## 1. Uniform Response Envelopes

### Success Envelope
Every successful response returns an HTTP 200 or 201 status code with a uniform `{ data }` payload and optional pagination metadata:

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "hasMore": false
  }
}
```

### Error Envelope
Every failure response returns an HTTP 4xx or 5xx status code with a machine-readable error code and human-readable message:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | INTERNAL_SERVER_ERROR",
    "message": "Human-readable explanation of error",
    "details": [ ... ]
  }
}
```

---

## 2. API Endpoint Matrix

| # | Method | Path | Auth | Roles | Rate Limit | Description |
|---|--------|------|------|-------|------------|-------------|
| 1 | `POST` | `/api/auth/signup` | Public | None | 5 req/min per IP | Register user & instant profile creation |
| 2 | `GET` | `/api/circles` | User Session | Any | Standard | List user's active care circles |
| 3 | `POST` | `/api/circles` | User Session | Elder | Standard | Create family care circle |
| 4 | `POST` | `/api/circles/join` | User Session | Any | 5 attempts/15 min (IP & User) | Join circle with hashed passcode |
| 5 | `GET` | `/api/circles/[id]/members` | User Session | Circle Member | Standard | List members with roles & privacy toggles |
| 6 | `PATCH` | `/api/circles/[id]/members` | User Session | Owner / Elder | Standard | Approve, change role, or update privacy permissions |
| 7 | `DELETE` | `/api/circles/[id]/members` | User Session | Owner / Elder | Standard | Revoke member from circle |
| 8 | `GET` | `/api/circles/[id]/invites` | User Session | Owner / Elder | Standard | List active, non-expired invite passcodes |
| 9 | `POST` | `/api/circles/[id]/invites` | User Session | Owner / Elder | Standard | Generate hashed, expiring, single/multi-use passcode |
| 10 | `DELETE` | `/api/circles/[id]/invites` | User Session | Owner / Elder | Standard | Revoke active invite code immediately |
| 11 | `GET` | `/api/circles/[id]/audit` | User Session | Elder / Owner | Standard | Fetch circle audit trail visible to elder |
| 12 | `GET` | `/api/medications` | User Session | Circle Member | Standard | List active medications & stock thresholds |
| 13 | `POST` | `/api/medications` | User Session | Owner / Editor | Standard | Add new medication schedule |
| 14 | `PATCH` | `/api/medications` | User Session | Owner / Editor | Standard | Update dosage, schedule, or stock |
| 15 | `DELETE` | `/api/medications` | User Session | Owner / Editor | Standard | Deactivate medication schedule |
| 16 | `POST` | `/api/medications/log` | User Session | Circle Member | Standard | Log dose: `taken`, `skipped`, or `missed` |
| 17 | `GET` | `/api/adherence/insights` | User Session | Circle Member | Standard | Weekly/monthly adherence %, streaks, and pattern detector |
| 18 | `GET` | `/api/appointments` | User Session | Circle Member | Standard | List upcoming doctor appointments |
| 19 | `POST` | `/api/appointments` | User Session | Owner / Editor | Standard | Create appointment |
| 20 | `PATCH` | `/api/appointments/[id]` | User Session | Owner / Editor | Standard | Update appointment or mark done/cancelled |
| 21 | `DELETE` | `/api/appointments/[id]` | User Session | Owner / Editor | Standard | Cancel/delete appointment |
| 22 | `POST` | `/api/cron/reminders` | CRON_SECRET | Server | Cron / Webhook | Automated reminder dispatcher (doses, escalations, appts) |
| 23 | `POST` | `/api/cron/test-reminder` | User Session | Non-Prod | 10 req/min | Interactive demo email notification dispatcher |
| 24 | `GET` | `/api/messages` | User Session | Circle Member | Standard | List signed audio messages |
| 25 | `POST` | `/api/messages` | User Session | Circle Member | Standard | Send private voice message |
| 26 | `POST` | `/api/checkin` | User Session | Elder | Standard | Voice health checkin & symptom analysis |
| 27 | `GET` | `/api/summary` | User Session | Circle Member | Standard | Daily mood, adherence, and checkin summary |

---

## 3. Detailed Route Specifications

### 3.1 Passcode Join Circle (`POST /api/circles/join`)
- **Request Body**:
  ```json
  {
    "passcode": "E8K2M9",
    "notes": "Joining as daughter"
  }
  ```
- **Validation**: `joinCirclePasscodeSchema` (alphanumeric 6-8 chars uppercase normalized).
- **Security**: Rate limited to 5 failures per 15 minutes per IP (`passcode_ip:<ip>`) AND per user ID (`passcode_user:<id>`). Passcodes are compared in constant-time using bcrypt against `code_hash`. Raw passcodes are never stored.
- **Success Response (200)**:
  ```json
  {
    "data": {
      "success": true,
      "circle_id": "3b2dffda-1b8e-44a5-835a-c58083c75b29",
      "circle_name": "Vance Family Care Circle",
      "status": "pending",
      "assigned_role": "editor",
      "message": "Join request submitted. Awaiting approval from the elder."
    }
  }
  ```
- **Error Responses**:
  - `400`: Passcode format invalid.
  - `401`: Missing authentication session.
  - `404`: Invalid, expired, or revoked passcode.
  - `429`: Passcode lockout active. Try again in 15 minutes.

---

### 3.2 Automated Reminders (`POST /api/cron/reminders`)
- **Authorization**: `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
- **Logic**:
  1. Upcoming dose reminders (configurable 15-30m lead time).
  2. Missed dose alerts Level 1: Overdue by +15m (elder + caregivers with `missed_doses: true`).
  3. Missed dose alerts Level 2 URGENT escalation: Overdue by +60m (all editors & viewers).
  4. Appointment reminders 24h and 2h before scheduled time.
  5. Deduplication: Deterministic idempotency key checked against `notification_log`.
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "timestamp": "2026-11-15T13:10:00.000Z",
    "report": {
      "upcomingDoseSent": 2,
      "missedDoseLevel1Sent": 1,
      "missedDoseLevel2Sent": 0,
      "appointment24hSent": 1,
      "appointment2hSent": 0,
      "errors": []
    }
  }
  ```

---

### 3.3 Adherence Insights (`GET /api/adherence/insights`)
- **Query Params**: `user_id` (optional, defaults to authenticated user).
- **Zero-Dose Safety**: If no medications are scheduled, returns `hasData: false` and `"No data yet"` (never 100%).
- **Pattern Detector**: Analyzes most-missed time slots and provides rule-based schedule optimization tips with medical disclaimer.
- **Success Response (200)**:
  ```json
  {
    "data": {
      "insight": {
        "hasData": true,
        "weeklyAdherenceRate": 92,
        "monthlyAdherenceRate": 90,
        "streakDays": 7,
        "totalTaken": 25,
        "totalMissed": 2,
        "patterns": [
          {
            "timeSlot": "12:30",
            "missedPercentage": 14,
            "suggestion": "You frequently miss your 12:30 midday dose. Consider setting a calendar alarm or aligning with lunch routines."
          }
        ],
        "disclaimer": "Rule-based adherence insight only. Not medical advice. Always consult your doctor or licensed pharmacist before making any changes to your medication schedule."
      }
    }
  }
  ```
