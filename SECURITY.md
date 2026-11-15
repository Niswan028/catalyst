# CareConnect Security Policy & STRIDE Threat Model

CareConnect is designed from the ground up for high-stakes healthcare and medication management. This document articulates our security architecture, defense-in-depth controls, threat model, and vulnerability management policies.

---

## 1. STRIDE Threat Model & Mitigations

| Threat Category | Potential Attack Vector | CareConnect Defense & Mitigation |
|-----------------|-------------------------|----------------------------------|
| **Spoofing** | Attacker attempts to guess family circle passcodes or impersonate circle members. | • Dual-axis rate limiting: 5 failed attempts per 15 minutes per IP (`passcode_ip:<ip>`) AND per user ID (`passcode_user:<id>`).<br>• Passcodes are never stored raw; hashed using **bcrypt** with salt rounds.<br>• Passcode verification executed in constant time to prevent timing attacks.<br>• Expiring passcodes (24h to 7d) with configurable single or multi-use limits.<br>• Cryptographic session validation via Supabase Auth on every API request. |
| **Tampering** | Unauthorized modifications to medication schedules, appointment times, or dose logs. | • Strict Role-Based Access Control: Only `owner` and `editor` roles can add, edit, or delete medications and appointments. `viewer` role is strictly read-only.<br>• Strict runtime payload validation on all endpoints using **Zod** schemas.<br>• Row-Level Security (RLS) policies at the database layer enforcing circle ownership isolation. |
| **Repudiation** | A caregiver or member claims they did not alter medication stock or schedule. | • Comprehensive, immutable `audit_log` records every mutation (`CREATE`, `UPDATE`, `DELETE`), capturing `actor_id`, `actor_name`, `action`, `resource_type`, `resource_id`, `timestamp`, and `metadata`.<br>• Elder has full audit visibility directly from their Family Care Circle dashboard. |
| **Information Disclosure** | Unauthorized parties viewing elder health records, audio check-ins, or medication history. | • **Elder Privacy Controls**: The elder explicitly chooses per-member visibility permissions (`can_view_medications`, `can_view_appointments`, `can_view_checkins`, `can_view_voice_messages`, `can_view_insights`).<br>• **Private Audio Storage**: The Supabase storage bucket `voice-messages` is strictly PRIVATE (`public = false`). Audio is accessed solely through short-lived presigned signed URLs (valid 60–300 seconds).<br>• No secrets or service role keys ever exposed to the client or checked into Git. |
| **Denial of Service** | Flooding email endpoints, brute-forcing passcodes, or triggering repetitive cron jobs. | • In-memory sliding-window rate limiters on passcode and test reminder routes.<br>• Automated reminders protected by a cryptographically strong `CRON_SECRET`.<br>• Idempotent notification engine: deterministic idempotency keys (`type:entityId:window:email`) stored in `notification_log` prevent duplicate email dispatch.<br>• Pagination and query result limits enforced on all listing endpoints. |
| **Elevation of Privilege** | A viewer attempting to escalate privileges to editor or approved status without elder consent. | • All joining members land in `pending` status until the elder explicitly approves them.<br>• Server-side role authorization checks (`withCircleRole`, `checkElderPrivacyPermission`) enforce role constraints regardless of client-supplied payloads.<br>• Elders can change roles or revoke any member at any time with immediate invalidation. |

---

## 2. Row-Level Security (RLS) Policy Architecture

All application tables enforce PostgreSQL Row-Level Security:

1. **`care_circles`**:
   - `SELECT`: Allowed for elder (`elder_id = auth.uid()`) or approved circle members.
   - `INSERT`: Allowed for elders.
   - `UPDATE` / `DELETE`: Restricted to circle owner (`elder_id = auth.uid()`).

2. **`circle_members`**:
   - `SELECT`: Allowed for members of the same care circle.
   - `INSERT`: Handled via secure server-side join endpoints.
   - `UPDATE` / `DELETE`: Restricted to circle owner / elder.

3. **`medications` & `appointments`**:
   - `SELECT`: Allowed for approved circle members with active read permissions.
   - `INSERT` / `UPDATE` / `DELETE`: Restricted to users with `owner` or `editor` roles.

4. **`audit_log` & `notification_log`**:
   - `SELECT`: Allowed for elder owner.
   - `INSERT`: Restricted to system / authenticated service actions.

---

## 3. Storage Security (Voice Messages)

Voice check-ins and audio messages contain sensitive personal health information:
- The storage bucket `voice-messages` is configured as **private** (`public = false`).
- Audio files are stored under isolated path prefixes: `{user_id}/{filename}`.
- Clients never receive permanent public URLs. Instead, the backend verifies membership and generates short-lived presigned URLs via `supabase.storage.from('voice-messages').createSignedUrl(path, 300)`.

---

## 4. HTTP Security Headers

CareConnect implements strict HTTP security headers configured in `next.config.js`:

```javascript
[
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https: wss:; media-src 'self' blob: data: https:; frame-ancestors 'none';"
  }
]
```

---

## 5. Security Environment & Secret Handling

- All sensitive credentials (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `SMTP_PASS`) are loaded strictly server-side from environment variables.
- Verified in `.gitignore`: `.env.local` and private credential files are never committed to version control.
- `lib/env.ts` validates required environment variables at runtime with Zod and fails fast if any required secret is missing or malformed.
- A comprehensive template `.env.local.example` documents every variable for authorized operators.

---

## 6. Reporting Security Vulnerabilities

If you identify a security issue in CareConnect, please report it privately:
- **Email**: `security@careconnect.local` or open a confidential GitHub Security Advisory.
- We aim to acknowledge reports within 24 hours and issue patches within 72 hours.
