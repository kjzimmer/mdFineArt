# Admin UI Design Standard
**Reference implementation:** mdFineArt (melodydebenedictis.com)
**Date:** July 2026
**Purpose:** Design standard for the shared admin modules — Contact, People, Analytics.
Other sites adopt this layout and substitute their own design tokens.

---

## Overall Layout Structure

The admin uses a **top navigation bar** layout — no left sidebar. Full-page structure:

```
┌─────────────────────────────────────────────────────────┐
│  STICKY HEADER                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Site Name · Admin                    Log out     │  │  ← top bar row
│  │  [Tab] [Tab] [Tab] [Tab] [Tab] [Tab] [Tab]        │  │  ← tab row
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  MAIN CONTENT AREA (max-w-7xl, centered, px-4/6/8)     │
│  py-8 top padding                                       │
└─────────────────────────────────────────────────────────┘
```

**Header:** `position: sticky; top: 0; z-index: 40; border-bottom: 1px solid {border}; background: {bg} at 95% opacity; backdrop-filter: blur(12px)`

**Content area:** `max-width: 80rem; margin: 0 auto; padding: 2rem 1rem` (responsive: 1.5rem at sm, 2rem at lg)

---

## Header — Top Bar Row

- **Left:** Site name + "· Admin" — `text-sm font-semibold uppercase tracking-[0.18em] color: {text} at 60% opacity`
- **Right:** "Log out" button — `text-xs uppercase tracking-[0.2em] color: {text} at 50% opacity; hover: {text} at 100%`
- Padding: `py-4 px-4/6/8` (matches content area horizontal padding)

---

## Tab Navigation

Horizontal scrollable row, flush below the top bar. Each tab:

```
border-bottom: 2px solid transparent    ← inactive
border-bottom: 2px solid {accent}       ← active
padding: 0.75rem 1rem
font-size: 0.875rem
text-transform: uppercase
letter-spacing: 0.14em
```

- **Active:** `color: {accent}; border-color: {accent}`
- **Inactive:** `color: {text} at 60% opacity; border-color: transparent; hover: {text} at 100%`
- Tabs overflow horizontally on mobile (`overflow-x: auto`)

**Tab order:** App-specific content tabs come first. The three shared modules always appear at the end, in this order: **Contact → People → Analytics**.

---

## Design Tokens

Define as Tailwind custom colors or CSS variables. All admin components use token names — no hardcoded hex values in component files.

| Token | Reference Value | Usage |
|-------|----------------|-------|
| `bg` | `#0f0d0b` | Page background |
| `surface` | `#1a1612` | Card / panel backgrounds |
| `border` | `#2e2820` | All borders |
| `text` | `#f0e8dc` | Primary text |
| `muted` | `#8a7c6e` | Mid-tone (rarely used directly) |
| `accent` | `#c4843a` | Active states, CTAs, highlights |
| `accentHover` | `#d9953f` | Accent hover state |
| `success` | `#4a7c59` | Success / active green |

Opacity variants of `text` and `accent` are used throughout:
- `text/70`, `text/60`, `text/50`, `text/40` — body, secondary, meta, timestamps
- `accent/80`, `accent/20`, `accent/15`, `accent/10`, `accent/5` — section labels, badges, tints

The only hardcoded hex values that appear outside config are inside `AdminAnalytics` for Recharts colors (chart lines, tooltip background). When porting to another site, replace these with the site's accent token value.

---

## Typography

| Element | Spec |
|---------|------|
| Body font | Inter, sans-serif |
| Display font | Cormorant Garamond, serif — via `.section-heading` class |
| Page title (h2) | `text-2xl font-semibold text-text` |
| Section group header | `text-xs uppercase tracking-[0.3em] text-accent/80` |
| Card section header (analytics) | `text-sm font-semibold uppercase tracking-[0.2em] text-text/60` |
| Tab labels | `text-sm uppercase tracking-[0.14em]` |
| Action buttons | `text-xs uppercase tracking-widest` |
| Stat value | `text-3xl font-semibold text-text` |
| Stat label | `text-xs uppercase tracking-[0.25em] text-text/50` |
| Body text in cards | `text-sm text-text/70` or `text-text/80` |
| Secondary info | `text-sm text-text/60` |
| Timestamps / meta | `text-xs text-text/50` or `text-text/40` |
| Name in list rows | `font-semibold text-text text-sm` |
| Email in list rows | `text-xs text-text/60` |

---

## Contact Inbox Layout

```
┌──────────────────────────────────────────────────────┐
│  All Inquiries                    [3 unread] badge   │
├──────────────────────────────────────────────────────┤
│  COMMISSIONS                                         │  ← group header
│  ┌────────────────────────────────────────────────┐  │
│  │  Name — email@...        [Mark read] [View]    │  │
│  │  Subject line                                  │  │
│  │  Jan 1, 2026 · Unread                          │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │  (expanded item)                               │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  Full message body, whitespace-preserved  │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
│  PAINTING INQUIRIES                                  │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

**Group order:** Commissions → Classes → Painting Inquiries → Other. Empty groups are omitted.

**Unread badge** (next to title): `rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent`

**Item card:**
- Unread: `rounded-xl border border-accent/50 bg-accent/5 p-5`
- Read: `rounded-xl border border-border bg-bg/90 p-5`

**Card interior — two-column flex (items-start justify-between gap-4):**
- **Left:** Name (`font-semibold text-text`) + email as `text-sm font-normal text-text/60` inline after em-dash. Subject on next line `text-sm text-text/70`. Date + "· Unread" on next line `text-xs text-text/50`.
- **Right** (shrink-0, gap-3): "Mark read" (`text-xs uppercase tracking-widest text-accent`) if unread, "View" / "Close" toggle (`text-xs uppercase tracking-widest text-text/50`)

**Expanded body** (inline below card interior, `mt-4`):
`rounded-xl border border-border bg-surface/60 p-4 text-sm text-text/80 whitespace-pre-wrap leading-7`
- Commission meta (size / budget / deadline / status) below body: `text-xs text-text/50`
- Phone if present: `text-text/60`

---

## People CRM Layout

Two-column master-detail. List narrows when detail is open:

```
┌──────────────────┬─────────────────────────────────────┐
│  LIST (w-80)     │  DETAIL (flex-1)                    │
│                  │                                      │
│  People   12 tot │  Name                 Edit           │
│  [Copy emails]   │  email                Unsubscribe    │
│                  │  phone                Invoice        │
│  ┌────────────┐  │  notes box            Delete (red)   │
│  │ Name       │  │  Added Jan 1                         │
│  │ email      │  │                                      │
│  │ [Newsletter]│  │  [Newsletter: Subscribed]  badge    │
│  └────────────┘  │                                      │
│  ┌────────────┐  │  CONTACT MESSAGES    ← section hdr  │
│  │ (selected) │  │  ┌──────────────────────────────┐   │
│  │ active bg  │  │  │ Subject          Jan 1       │   │
│  └────────────┘  │  │ Message body text             │   │
│                  │  └──────────────────────────────┘   │
└──────────────────┴─────────────────────────────────────┘
```

When no detail is open, the list expands to `flex-1` (full width). Min height: `600px`. Gap between columns: `1.5rem`.

### List Column

- Title row: `text-2xl font-semibold text-text` + count `text-xs text-text/50`, baseline-aligned, space-between
- "Copy N subscriber emails" action: `text-xs uppercase tracking-widest text-accent` — shown only when subscribers exist; becomes "Copied!" for 2 seconds after click, then reverts
- Each person card: clickable button, `rounded-xl border px-4 py-3 w-full text-left`
  - Selected: `border-accent bg-accent/10`
  - Unselected: `border-border bg-surface/60 hover:border-accent/40`
  - Name: `font-semibold text-text text-sm`
  - Email: `text-xs text-text/60 mt-0.5`
  - Tag row below (flex-wrap gap-2 mt-1.5): Newsletter pill `text-[10px] uppercase tracking-widest bg-accent/15 text-accent px-2 py-0.5 rounded-full`, message / commission counts `text-[10px] text-text/50`

### Detail Panel — Header Card

`rounded-2xl border border-border bg-surface/80 p-6`

- Name: `text-xl font-semibold text-text`
- Email: `text-sm text-text/70 mt-1`
- Phone (if present): `text-sm text-text/60`
- Notes (if present): inset box `bg-bg/60 rounded-lg px-3 py-2 border border-border text-sm text-text/60 mt-3`
- "Added [date]": `text-xs text-text/40 mt-2`
- **Action buttons** (top-right, flex-col items-end gap-2): all `text-xs uppercase tracking-widest`
  - Edit: `text-text/50 hover:text-text`
  - Unsubscribe / Resubscribe: `text-accent hover:text-accentHover` when active, `text-text/40 hover:text-text/60` when inactive
  - Invoice (site-specific — omit if not applicable): `text-accent hover:text-accentHover`
  - Delete: `text-red-400/70 hover:text-red-400`

**Newsletter status chip** (below info, flex-wrap gap-2):
- Subscribed: `text-xs px-3 py-1 rounded-full bg-accent/15 text-accent`
- Unsubscribed: `text-xs px-3 py-1 rounded-full bg-border text-text/50`
- Not subscribed: `text-xs px-3 py-1 rounded-full bg-border text-text/40`

### Edit Mode

Replaces the display view inline (no modal). Input / textarea style:
`rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent`

Textarea adds `resize-none`. Save (`text-accent`) / Cancel (`text-text/50`) as text buttons below the fields.

### Detail History Sections (below header card)

- Section header: `text-xs uppercase tracking-[0.3em] text-accent/80`
- Each item: `rounded-xl border border-border bg-surface/60 px-4 py-3`
- Subject + date: flex justify-between; subject `text-sm font-medium text-text`; date `text-xs text-text/40 shrink-0`
- Status (commissions): `text-xs text-accent/80 uppercase tracking-wider mt-1`
- Body: `text-sm text-text/70 whitespace-pre-wrap mt-1`

---

## Analytics Dashboard Layout

```
┌──────────────────────────────────────────────────┐
│  Analytics                        [7d][14d][30d] │  ← range pills right-aligned
│  Updated 2:14 PM · cached 15 min                 │
├──────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ Unique       │ │ Page Views   │ │ Requests  │ │  ← 3-col stat cards
│  │ Visitors     │ │              │ │           │ │
│  │ 1,482        │ │ 4,201        │ │ 12,847    │ │
│  └──────────────┘ └──────────────┘ └───────────┘ │
├──────────────────────────────────────────────────┤
│  VISITORS OVER TIME                              │
│  [LineChart h-56 — full width]                   │
│  — Unique visitors   — Page views                │  ← inline legend
├──────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌──────────────────────┐│
│  │ TOP COUNTRIES        │ │ DEVICE TYPES         ││  ← 2-col grid
│  │ Progress bar list    │ │ BarChart h-40        ││
│  └─────────────────────┘ └──────────────────────┘│
├──────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌──────────────────────┐│
│  │ TOP PAGES            │ │ TOP REFERRERS        ││  ← 2-col grid
│  │ path · views list    │ │ host · visits list   ││
│  └─────────────────────┘ └──────────────────────┘│
└──────────────────────────────────────────────────┘
```

### Range Selector Pills

`rounded-full border px-4 py-1.5 text-sm font-medium transition`
- Active: `border-accent bg-accent/10 text-accent`
- Inactive: `border-border text-text/60 hover:border-accent hover:text-accent`

### Status Text (below page title)

`text-sm text-text/50` — "Updated [time] · cached 15 min" when live; "Mock data — Cloudflare not yet connected" when falling back to mock. Errors in `text-sm text-red-400`.

### Stat Cards

`rounded-2xl border border-border bg-surface/60 px-6 py-5`
- Label: `text-xs uppercase tracking-[0.25em] text-text/50`
- Value: `mt-2 text-3xl font-semibold text-text` (formatted with `toLocaleString()`)

### Chart Cards

All chart containers: `rounded-2xl border border-border bg-surface/60 p-6`
Section heading: `text-sm font-semibold uppercase tracking-[0.2em] text-text/60`

**Line chart (Visitors Over Time):**
- Height: `224px` (`h-56`)
- Library: Recharts `LineChart` + `ResponsiveContainer`
- Grid: `strokeDasharray="3 3"` `stroke="rgba(255,255,255,0.06)"`
- Axes: tick `fill="rgba(255,255,255,0.4)"` `fontSize=11`, no tick lines, no axis lines
- Unique visitors line: `stroke={accent}` `strokeWidth=2` `dot=false` `activeDot={{ r:4 }}`
- Page views line: `stroke={accent at 35% opacity}` `strokeWidth=1.5` `dot=false`
- Tooltip: `background: {surface}, border: 1px solid rgba(255,255,255,0.1), borderRadius: 8`
- Legend: below chart `mt-3 flex gap-5 text-xs text-text/50` — each item is a `4px × 16px` inline color swatch + label

**Country progress bars:**
- Row: `flex items-center gap-3`
- Label: `w-32 truncate text-sm text-text/80`
- Track: `flex-1 h-1.5 rounded-full bg-border/40`
- Fill: `h-full rounded-full bg-accent` with `width: {pct}%`
- Percent: `w-8 text-right text-sm text-text/50`

**Bar chart (Device Types):**
- Height: `160px` (`h-40`)
- Library: Recharts `BarChart`
- Bars: `fill={accent}` `radius={[4,4,0,0]}`
- Same grid and axis styling as line chart

**Simple lists (Top Pages, Top Referrers):**
- `space-y-2`; each row `flex items-center justify-between text-sm`
- Path: `font-mono text-text/70`; Count: `text-text/50`

**"Requires Web Analytics beacon" note:**
`text-xs text-accent/70 italic mt-1` — shown below section heading for sections that need the RUM beacon (Device Types, Top Pages, Top Referrers)

---

## Status Messages

| Situation | Treatment |
|-----------|-----------|
| Loading | `<p className="text-text/50">Loading…</p>` |
| Error | `text-sm text-red-400` below page title |
| Data source note | `text-sm text-text/50` below page title |
| Saving (button) | Label changes to "Saving…", `opacity-50 disabled` |
| Copy confirmation | Label changes to "Copied!" for 2 seconds, then reverts |

---

## Empty States

No illustrations or icons — plain inline text only.

`text-sm text-text/60` (or `text-text/50`)

Examples:
- "No messages yet."
- "No people yet."
- "No contact history yet."

---

## Confirmation Dialogs

Delete actions use the browser native `confirm()`. No custom modal. Message format:

```
Delete {name} ({email}) and all their records?
```

---

## Stub Sections (Unimplemented Modules)

For tabs that exist in the nav but have no implementation yet:

```
rounded-2xl border border-border bg-surface/60 py-24 text-center
flex flex-col items-center justify-center
  "Coming Soon"  →  text-sm uppercase tracking-[0.3em] text-accent/80
  Section name   →  text-2xl font-semibold text-text (section-heading class)
  Description    →  max-w-sm text-text/60 mt-3
```

---

## Adapting to Another Site

The layout structure and spacing are fixed by this standard. To apply to a different site:

1. **Replace token values** in `tailwind.config.js` (or equivalent CSS variables). All component classes reference token names (`bg-accent`, `text-text`, etc.) — changing the tokens recolors the entire admin.
2. **Swap fonts** — replace Inter (body) and Cormorant Garamond (display) with the site's own font stack. Update the `.section-heading` class and `fontFamily` config accordingly.
3. **Keep spacing and layout unchanged** — tab height, card padding, column widths, grid counts are fixed by this standard and should not vary between sites.
4. **Recharts colors** — the only hardcoded hex values in component files are inside `AdminAnalytics` (chart line colors, tooltip background). Replace with the site's accent token value when porting.
5. **Site-specific action buttons** — the "Invoice" button in People is mdFineArt-specific. Omit or replace with a site-relevant action. The button slot (top-right column in detail panel) and its styling are standard.
