# Visitor Tracking & Privacy Spec

A site-agnostic specification for anonymous visitor tracking with user consent,
designed to work consistently across multiple sites and serve as the foundation
for a SaaS product. Review this spec across all apps before implementing —
the goal is one shared approach, not per-site variations.

---

## 1. Privacy Policy

The privacy policy must be a publicly accessible page (`/privacy`) on every site.
Content should be plain language, not legal boilerplate. Minimum required sections:

### What we collect
- A randomly generated visitor ID (UUID) stored in a browser cookie, used to
  recognize returning visitors on this device
- Pages visited, paintings or items viewed, and time of visit
- If you submit a form (contact, commission, newsletter): your name, email, and
  phone number as provided

### What we do not collect
- Your name or identity unless you provide it via a form
- Your IP address (beyond what web servers log by default)
- Any data from third-party advertising networks
- Payment details (handled entirely by Square; we never see card numbers)

### Why we collect it
- To understand how people use the site so we can improve it
- To recognize returning visitors and avoid showing forms they've already completed
- To connect form submissions to prior visit history when you choose to reach out

### How long we keep it
- Anonymous visit data: 12 months from last visit, then deleted
- Form submission data (name, email, messages): retained as long as the business
  relationship is active; deleted on request
- Consent decision: retained for the life of the cookie (2 years)

### Your rights
- **Access**: request a copy of data associated with your email address
- **Deletion**: request deletion of all your data — email [contact address]
- **Opt out**: decline tracking via the consent banner or clear your browser cookies
  at any time; the site works fully without the tracking cookie

### Third parties
- Cloudflare: processes all web traffic (see Cloudflare's privacy policy)
- Square: handles payment processing (see Square's privacy policy)
- [Email service — Resend/SendGrid]: used to deliver transactional emails

### Contact
[Site owner name and email]

### Policy version
Each published version of this policy should have a version number and date
(e.g., `v1.0 — 2026-06-22`). Store the current version string in a config
constant — it's recorded alongside each consent decision so you know which
policy the user agreed to.

---

## 2. Consent Banner

### Behavior

- Shown on **first visit only**, before any tracking cookie is set
- Persists across pages until the user makes a decision
- Does **not** block page content — banner overlays at bottom of screen
- Decision is recorded immediately on click; banner dismissed without page reload
- If user has previously decided (either way), banner never shows again

### Decision states

| State | Cookie set | Tracking active |
|---|---|---|
| No decision yet | None | No |
| Accepted | `vid` (2yr) + `cookie_consent=accepted` (2yr) | Yes |
| Declined | `cookie_consent=declined` (2yr) | No |

### Banner copy (adapt per site)

> **This site uses a cookie to recognize returning visitors.**
> No personal data is collected until you fill out a form.
> [Learn more](/privacy)
>
> [ Accept ] [ Decline ]

Keep it short. One sentence of what, one sentence of what not. Link to full policy.
No dark patterns — Accept and Decline must be equal visual weight.

### Banner component spec

```typescript
// ConsentBanner.tsx
// Reads: localStorage key 'cookie_consent' (or cookie — see Cookie Spec below)
// On accept: sets vid cookie + consent cookie, fires onAccept callback
// On decline: sets consent cookie only, fires onDecline callback
// Renders: null if consent already recorded

interface ConsentBannerProps {
  privacyPolicyUrl?: string;   // default '/privacy'
  onAccept: () => void;
  onDecline: () => void;
}
```

Position: `fixed bottom-0 left-0 right-0 z-50` — above all other content.
Style to match site theme. Include a close/dismiss button that acts as Decline.

---

## 3. Cookie Specification

### Tracking cookie (`vid`)

| Attribute | Value |
|---|---|
| Name | `vid` |
| Value | UUID v4 (e.g. `a1b2c3d4-...`) |
| Max-Age | 63,072,000 seconds (2 years) |
| SameSite | `Lax` |
| HttpOnly | `false` (frontend must read it to attach to API requests) |
| Secure | `true` in production |
| Path | `/` |

Only set this cookie **after** the user accepts. Never set it before consent.

### Consent cookie (`cookie_consent`)

| Attribute | Value |
|---|---|
| Name | `cookie_consent` |
| Value | `accepted` or `declined` |
| Max-Age | 63,072,000 seconds (2 years) |
| SameSite | `Lax` |
| HttpOnly | `false` |
| Secure | `true` in production |
| Path | `/` |

This cookie is set regardless of the decision — it records that a decision was made
so the banner does not reappear.

### Reading consent on page load

```typescript
function getConsentState(): 'accepted' | 'declined' | 'unknown' {
  const value = document.cookie
    .split('; ')
    .find((c) => c.startsWith('cookie_consent='))
    ?.split('=')[1];
  return (value as 'accepted' | 'declined') ?? 'unknown';
}

function getVisitorId(): string | null {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith('vid='))
    ?.split('=')[1] ?? null;
}
```

---

## 4. Data Model

### Schema (Prisma)

```prisma
model AnonymousVisitor {
  id        String         @id @default(cuid())
  vid       String         @unique   // matches the browser cookie value
  personId  String?
  person    Person?        @relation(fields: [personId], references: [id], onDelete: SetNull)
  firstSeen DateTime       @default(now())
  lastSeen  DateTime       @updatedAt
  events    VisitorEvent[]
}

model VisitorEvent {
  id         String          @id @default(cuid())
  visitorId  String
  visitor    AnonymousVisitor @relation(fields: [visitorId], references: [id], onDelete: Cascade)
  type       VisitorEventType
  path       String?         // URL path visited
  referer    String?         // referring URL
  entityId   String?         // painting ID, blog post ID, etc.
  meta       Json?           // any additional structured data
  createdAt  DateTime        @default(now())
}

enum VisitorEventType {
  PAGE_VIEW
  PAINTING_VIEW     // opened lightbox or detail page
  PAINTING_INQUIRE  // clicked inquire button
  FORM_SUBMIT       // any form submitted
  SEARCH            // search performed
}
```

### Linking anonymous to known on form submit

When a visitor submits any form (contact, commission, newsletter):

```typescript
// server-side, in any form route:
const vid = req.cookies?.vid;
if (vid) {
  const visitor = await prisma.anonymousVisitor.findUnique({ where: { vid } });
  if (visitor && !visitor.personId) {
    await prisma.anonymousVisitor.update({
      where: { vid },
      data: { personId: person.id },  // person was just upserted by email
    });
  }
}
```

After this point, the Person record has their full anonymous visit history attached.

### Data retention

Run a cleanup job (cron or scheduled script) to delete `VisitorEvent` records older
than 12 months and `AnonymousVisitor` records with no events and no linked Person
older than 30 days. Do not delete linked records — those are part of the Person's
history and subject to the person's own retention/deletion rights.

---

## 5. Tracking Implementation

### Frontend: sending events

All tracking calls are fire-and-forget — never block navigation or UX on them.

```typescript
// lib/tracking.ts
const VID_COOKIE = 'vid';
const CONSENT_COOKIE = 'cookie_consent';

function getCookie(name: string): string | null {
  return document.cookie.split('; ')
    .find((c) => c.startsWith(`${name}=`))?.split('=')[1] ?? null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function hasConsent(): boolean {
  return getCookie(CONSENT_COOKIE) === 'accepted';
}

export function acceptConsent() {
  const vid = getCookie(VID_COOKIE) ?? crypto.randomUUID();
  setCookie(VID_COOKIE, vid, 63_072_000);
  setCookie(CONSENT_COOKIE, 'accepted', 63_072_000);
  return vid;
}

export function declineConsent() {
  setCookie(CONSENT_COOKIE, 'declined', 63_072_000);
}

export function track(type: string, data?: Record<string, unknown>) {
  if (!hasConsent()) return;
  const vid = getCookie(VID_COOKIE);
  if (!vid) return;
  // fire and forget
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vid, type, ...data }),
  }).catch(() => {});  // silently ignore failures
}
```

### Backend: event ingestion route

```
POST /api/track    (public, no auth required)
```

```typescript
// Accepts: { vid, type, path, entityId, meta }
// Upserts AnonymousVisitor by vid, creates VisitorEvent
// Never returns an error to the client — always 200
// Validate type against VisitorEventType enum
// Rate limit: max 60 events per vid per minute to prevent abuse
```

### What to track (minimum viable set)

| Event | When to fire | entityId |
|---|---|---|
| `PAGE_VIEW` | On route change | — |
| `PAINTING_VIEW` | Lightbox opens or detail page loads | painting ID |
| `PAINTING_INQUIRE` | Inquire button clicked | painting ID |
| `FORM_SUBMIT` | Any form successfully submitted | form type |

Add more event types only when there's a specific question you want to answer.
Don't track everything speculatively.

---

## 6. Admin Dashboard — Visitor Tracking Panel

A new tab or section in the admin panel showing:

### Summary cards
- Total known visitors (with linked Person)
- Total anonymous visitors (no Person link yet)
- Events in last 30 days

### Top pages (own data, not Cloudflare)
- `/gallery` — 482 views
- `/commission` — 301 views

### Top paintings by views
- Most-viewed paintings in lightbox/detail — useful for curation decisions

### Returning visitor rate
- % of sessions from a vid seen before

### Person detail integration
In the existing People admin panel, add a **Visit History** section alongside
Contact Messages and Commissions. Shows the visitor's page views and painting
interactions before they ever filled out a form.

---

## 7. Consent Version Tracking

When the privacy policy changes materially, increment the version string.
Record which version each user consented to by storing it in the consent cookie
value or a separate DB field on AnonymousVisitor.

```
cookie_consent=accepted:v1.0
```

If the current policy version is newer than what a user consented to,
re-show the banner. Implement this only when you have a second policy version —
don't over-engineer for v1.

---

## 8. SaaS Considerations

When this becomes a multi-tenant product:

- **Data controller**: each site owner is the data controller for their visitors.
  You (the SaaS operator) are the data processor. This requires a Data Processing
  Agreement (DPA) with each site owner.
- **Isolation**: visitor data must be tenant-isolated — no cross-site tracking,
  no shared `vid` cookies across domains
- **Per-site privacy policy**: each site owner must publish their own privacy policy.
  The platform can provide a template but the site owner must customize and own it.
- **Per-site consent banner**: banner copy should be configurable per site
  (site name, contact email, policy URL)
- **Deletion requests**: the platform must expose a way for site owners to delete
  a specific visitor's data on request, to fulfill their data subject obligations

---

## 9. Data Subject Rights — Deletion Endpoint

```
DELETE /api/people/:id/data    [admin]
```

Deletes:
- All `VisitorEvent` records linked to this person's AnonymousVisitor
- The `AnonymousVisitor` record itself
- The `NewsletterSubscriber` record
- The `Person` record

Does NOT delete:
- `Order` records (financial records have their own retention requirements)
- `ContactMessage` records if they contain information about a third party

Document what is and isn't deleted in the response so the admin can confirm to the requester.

---

## Implementation Order (suggested)

1. Cookie spec + `lib/tracking.ts` utility
2. Consent banner component
3. Privacy policy page
4. `/api/track` ingestion route + DB schema
5. Page view tracking on route change
6. Painting view + inquire tracking
7. Form-submit → visitor link logic
8. Admin dashboard panel
9. Deletion endpoint
10. Consent version tracking (defer until policy v2)
