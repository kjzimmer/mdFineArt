# Events & Classes — WIP Spec

Branch: `feature/events-classes`

---

## Scope

Build config-driven Events and Classes pages. Landing page integration (checkboxes + link) deferred to a follow-on task.

---

## Events

### Data model — `Event`

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | |
| galleryId | String | FK → Gallery |
| title | String | |
| date | DateTime | stored as date; display as date only |
| time | String? | free text, e.g. "2:00 PM" or "2–5 PM" |
| venue | String | required |
| description | String? | |
| externalLink | String? | "More info" URL |
| imageUrl | String? | optional event image (R2 upload) |
| published | Boolean | default false |
| createdAt | DateTime | |

Public page shows published events sorted date asc (upcoming first). Admin sees all.

### API routes — `/api/events`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/events` | none | returns published only |
| GET | `/api/events/all` | requireAdmin | returns all including unpublished |
| POST | `/api/events` | requireAdmin | create |
| PATCH | `/api/events/:id` | requireAdmin | update any field |
| DELETE | `/api/events/:id` | requireAdmin | delete |

### Admin UI — Events tab (replaces StubSection)

- List of all events (upcoming + past), sorted by date desc
- Status badge: Published / Draft
- Inline toggle: publish/unpublish
- Add Event button → form panel (not modal — more fields)
- Edit / Delete per row
- Image upload optional

### Public page — `/events`

- Header section: "Events" label + page title from config (or sensible default)
- List of published events, sorted by date asc
- Each card: date + time, title, venue, description, optional image, optional "More info →" link button
- If no events published: friendly empty state

---

## Classes

### Page-level settings — additions to `SiteConfig`

| Field | Notes |
|-------|-------|
| classesLabel | Small label above heading, e.g. "Classes & Workshops" |
| classesHeading | Main h1, e.g. "Learn to paint the West." |
| classesImageUrl | Optional hero image shown right of header |

### Data model — `ClassOffering`

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | |
| galleryId | String | FK → Gallery |
| label | String | small eyebrow label, e.g. "One-on-One" |
| heading | String | card title, e.g. "Private instruction with Melody" |
| description | String | paragraph text |
| inquireSubject | String | email subject for inbox, e.g. "One-on-One Classes Inquiry" |
| sortOrder | Int | default 0; user reorders via up/down |
| published | Boolean | default true |
| createdAt | DateTime | |

### API routes — `/api/classes`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/classes` | none | returns published, sorted by sortOrder |
| GET | `/api/classes/all` | requireAdmin | returns all |
| POST | `/api/classes` | requireAdmin | create |
| PATCH | `/api/classes/:id` | requireAdmin | update |
| DELETE | `/api/classes/:id` | requireAdmin | delete |

### Admin UI — Classes tab (new tab)

- Page header card: classesLabel, classesHeading, classesImageUrl (auto-save on blur)
- Below: list of class offerings
  - Add Offering button → inline expand form
  - Edit / Delete / Published toggle per card
  - Up/Down sort buttons

### Public page — `/classes` (replaces hardcoded Classes.tsx)

- Header section: classesLabel + classesHeading on left, classesImageUrl on right (if set)
- Falls back to reasonable defaults if config not yet populated
- Cards below: one per published ClassOffering, in sortOrder
- Each card: label (eyebrow), heading, description paragraph, "Inquire" button
- Inquire button opens a contact modal; subject = offering.inquireSubject

---

## AdminLayout changes

- Add `'classes'` to `AdminTab` type and tabs array (between `events` and `config`)

---

## Build order

1. Schema: add Event, ClassOffering models + SiteConfig fields → migrate
2. Server: routes for events + classes
3. Admin: AdminEvents component (events tab)
4. Admin: AdminClasses component (new classes tab) + SiteConfig auto-save for page settings
5. Public: Events.tsx (replace stub)
6. Public: Classes.tsx (replace hardcoded)
7. SiteConfigContext: expose classesLabel, classesHeading, classesImageUrl
