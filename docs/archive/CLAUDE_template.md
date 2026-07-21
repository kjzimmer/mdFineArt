# CLAUDE.md — {Site Name}
*Read this file at the start of every session before doing anything else.*

---

## What This Project Is

{2-4 sentences. What the site does, who it serves, where it lives in production.
What phase it is in — teaser, admin foundation, full build, etc.}

**GitHub:** {repo URL}
**Production:** {domain or Railway temp URL}

---

## Current State

{CC maintains this section. Update it as features ship, are started, or are deferred.
Keep it current — this is what the next session reads to orient itself.}

**Live:**
- {feature or page}
- {feature or page}

**In flight:**
- {feature — link to docs/wip/{feature}.md}

**Deferred:**
- {feature — brief note on why}

---

## Doc Map

*Read the relevant doc before starting any task in that area. Do not rely on memory.*

| Doc | Read it for |
|-----|------------|
| `shared/SHARED_TECH_STACK.md` | Stack decisions, version pins, folder structure, infrastructure |
| `shared/SHARED_ADMIN_MODULES.md` | Auth, CRM, inbox, analytics — backend contracts |
| `docs/TECH_STACK.md` | Site-specific packages, deviations from shared stack |
| `docs/ARCHITECTURE.md` | DB schema, API routes, data flows, folder notes |
| `docs/SITE_DESIGN.md` | Design system, CSS approach, component conventions |
| `docs/CONTENT.md` | Page/route inventory, copy status (if this file exists) |
| `docs/wip/{feature}.md` | Everything about a feature currently in development |

---

## Critical Gotchas

{Site-specific things that will burn a session if CC doesn't know them.
Common candidates below — keep only what applies, add what's missing.}

- **Express 5 wildcards** — use `/admin/*path` not `/admin/*` — bare * crashes at startup
- **Vite base path** — `base: '/admin/'` required in vite.config.ts or admin SPA loads blank
- **Prisma generator** — always `provider = "prisma-client-js"` not `provider = "prisma-client"`
- **Prisma workflow** — `prisma migrate dev` locally, `prisma migrate deploy` on Railway. Never `prisma db push`
- {site-specific gotcha}
- {site-specific gotcha}

---

## What Never Changes

{Things CC must never touch regardless of instructions in the session.}

- `public/index.html` — approved design, do not restyle or restructure
- {other locked files or sections}

---

## Standing Rules

*These rules are identical across all sites. Do not modify this section.
If you identify a problem with these rules, append to `shared/SHARED_FEEDBACK.md`.*

### Session Start Checklist

Before doing anything else at the start of every session:

1. Check `incoming/` — if files are present, notify the user and ask whether to run
   the transition process before proceeding with other work
2. Read this file completely
3. Read the docs relevant to the current task (see Doc Map above)
4. Check `docs/wip/` for any features in flight that relate to the current task

### What CC Can and Cannot Edit

| Location | Permission |
|----------|-----------|
| `## Current State` section of this file | Read + Write |
| Everything else in this file | Read only |
| `shared/SHARED_FEEDBACK.md` | Append only |
| `docs/wip/*.md` | Read + Write |
| `docs/archive/` | No access — archiving is done manually |
| `shared/SHARED_TECH_STACK.md` | Read only |
| `shared/SHARED_ADMIN_MODULES.md` | Read only |
| `docs/TECH_STACK.md` | Read only |
| `docs/ARCHITECTURE.md` | Read only |
| `docs/SITE_DESIGN.md` | Read only |
| `docs/CONTENT.md` | Read only |
| All source files (`server/`, `client/`, `prisma/`) | Read + Write |

If something in a read-only doc is wrong, missing, or needs updating — log it in
`shared/SHARED_FEEDBACK.md` and proceed with best judgment for the current session.
Do not edit the doc directly.

### WIP File Discipline

- Every feature in active development gets a file: `docs/wip/{feature-name}.md`
- Name the file after the feature, not generically (never `temp.md` or `wip.md`)
- The wip file is the authoritative spec for that feature while it is in flight
- When the feature ships, notify the user — do not archive the wip file yourself;
  that is done manually after review in Claude.ai
- If a wip file exists for the current task, read it before writing any code

### Shared Doc Feedback

When you encounter a gap, conflict, or error in any shared doc:

1. Do not edit the shared doc
2. Append an entry to `shared/SHARED_FEEDBACK.md` using this format:

```
## [{date}] {shared doc filename}
**Site:** {this site's name}
**Type:** Gap | Conflict | Error | Suggestion
**Section:** {section heading in the shared doc}
**Issue:** {clear description of the problem}
**Suggested fix:** {what you think should change}
**Workaround used:** {what you did instead for this session}
```

3. Proceed with your best judgment for the current session
4. Note what you did in `## Current State`

### Incoming Folder Process

When files are present in `incoming/`:

1. Notify the user at session start: *"There are files in incoming/ —
   [{list filenames}]. Do you want to run the transition process before we proceed?"*
2. If yes: read all files in `incoming/`, then write `incoming/_assessment.md`
   (see format below) before making any changes to the repo
3. Wait for user confirmation before proceeding with the transition
4. After a successful transition: move files to their proper locations, clear
   `incoming/`, update `## Current State`
5. If the transition cannot be completed cleanly: log blockers in
   `shared/SHARED_FEEDBACK.md`, leave `incoming/` in place, notify the user

**`_assessment.md` format:**

```markdown
# Transition Assessment — {Site Name}
**Date:** {date}
**Incoming files:** {list}

## Summary
{2-3 sentence overall assessment — how far is this site from compliance,
what is the biggest gap, is anything blocking a clean transition?}

## Gap Analysis

### {Shared doc or standard being assessed}
**Current state:** {what this site has now}
**Required state:** {what the standard requires}
**Gap:** {what needs to change}
**Complexity:** Low | Medium | High
**Blocking issues:** {anything that prevents a clean transition — or "None"}

{repeat for each area}

## Transition Plan
{Ordered list of steps CC proposes to take, with rationale for the order}

## Questions for User
{Anything CC needs a decision on before proceeding}

## SHARED_FEEDBACK entries
{Any issues found in the shared docs themselves that need escalation}
```

### Code Quality Rules

- No `.js` files in `src/` — TypeScript only
- No `any` types without an explicit comment explaining why
- Routes call services — no Prisma calls in route files
- No hardcoded secrets — all sensitive values from environment variables
- Never commit `.env` — always keep `.env.example` current
