# MemeStack — 2026 Redesign & Upgrade Notes

A full-stack overhaul that unifies the visual language, hardens error paths,
and tightens the creator → social → community flow across ~28 pages.

---

## TL;DR

- Frontend fully redesigned to a **meme-native neo-brutalist** look:
  2px borders, 16px radii, chunky offset shadows, electric pink/purple accent,
  high-contrast surfaces, bold 800/900 type.
- Every page now uses the same primitives: `PageHeader`, `Section`,
  `StatCard`, `MemeCard`, `EmptyState`, `ErrorState`, `SkeletonCard`,
  `LoadingSpinner`, `FollowButton`.
- All async loaders use cancellation guards to prevent state updates after
  unmount.
- Theme tokens live on `palette.brand.*` and `tokens.shadow.*` so individual
  pages never inline gradients or shadow stacks.
- Backend unchanged in contract — all routes preserved. Some client-side
  helpers hardened (`ObjectId` validation, legacy `/uploads` path fallback,
  richer empty/error states).

---

## Design System

### Tokens (MUI theme extensions)

| Token                       | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `palette.brand.gradient`    | Primary → secondary gradient for CTA headers     |
| `palette.brand.accent`      | Electric pink/magenta highlight                  |
| `palette.brand.border`      | 2px panel border color                           |
| `palette.brand.surfaceSubtle` | Muted surface for secondary panels             |
| `palette.brand.bgAlt`       | Alt page background for stripe effects           |
| `tokens.shadow.sm`          | 2px offset shadow (default panels)               |
| `tokens.shadow.md`          | 4px offset shadow (hover state)                  |
| `tokens.shadow.lg`          | 6px offset shadow (primary CTAs, modals)         |

### Recurring patterns

- **Surface style**: `p: {xs: 2, md: 3}`, `borderRadius: 3`,
  `border: 2px solid brand.border`, `background: background.paper`,
  `boxShadow: tokens.shadow.sm`.
- **Hover escalation**: `transform: 'translate(-2px, -2px)'` +
  `boxShadow: tokens.shadow.md` on cards & tiles.
- **Type hierarchy**: 900 for headlines, 800 for buttons/labels,
  700 for chips/metadata.
- **Icon chips**: small `<Chip>` with icon slot for stats
  (likes, views, downloads, comments, followers).

---

## Page-by-Page Summary

### Core meme loop

- **Home** — hero PageHeader, featured memes surface, recent creator strip.
- **MemeGallery** — filter bar (search, category, sort), skeleton grid while
  loading, `MemeCard` grid, clean empty/error states.
- **MemeDetail** — hero image, creator card with `FollowButton`,
  stats tiles, comments section, share/download actions.
- **CreateMeme** — numbered step layout (upload → customize → post),
  template picker integration, preview surface.

### Creator tools

- **Templates** / **TemplateDetail** / **CreateTemplate** — consistent grid,
  template card with usage count and category chip.
- **TemplateManager** — filter bar, grid of owner templates with
  edit/delete menu, shared Create/Edit/Delete dialog body.
- **BatchProcessor** — three numbered neo-brutalist sections:
  1. Select images (file chips with delete)
  2. Configure operation (preset chips + per-op accordion: watermark /
     resize / compress / format)
  3. Process (large CTA + LinearProgress, result grid with preview dialog).
- **FolderManager** — folder tiles, drag reorder, create/rename/delete flow.

### Social

- **Profile** / **EditProfile** / **AccountSettings** — avatar + cover,
  stat tiles, tabbed content (posts / liked / saved), settings tabs with
  surface cards.
- **BrowseUsers** — creator grid with follow CTA and stats line.
- **FollowingFeed** — chronological feed of memes from followed creators
  with empty state prompting the user to follow more people.

### Community

- **Challenges** — challenge cards with status chips (live / upcoming /
  past), entry count, prize tile.
- **Groups** — group cards with member count, join CTA, category chip.
- **Collaborations** — status-aware grid, create CTA in header.
- **CreateCollaboration** — guided form with type picker & collaborator invite.
- **CollaborationDetail** — hero card with live pulse indicator, stats grid,
  action row (Join / New version / Invite / Fork / Comment / Share), tabs
  for Overview / Versions / Contributors / Comments / Advanced, 5 dialogs
  (version / join / invite / fork / comment), 30s auto-refresh + notification
  panel.

### Admin / Analytics

- **AnalyticsDashboard** — time-range picker, 8 stat cards,
  top-performing memes list (numbered ranks + category chip), category
  performance panel with LinearProgress.
- **ModerationDashboard** — admin-guarded, 4 KPI cards, tabbed table
  (All / Pending / Under review / Resolved) with per-row actions
  (warn / suspend / ban / resolve / dismiss) via single action dialog.

### Misc

- **Login** / **Register** — centered surface card, big inputs, clear CTA.
- **NotFound** — oversized 404 surface + back-home button.
- **ThemeDemo** — playground showing surfaces, buttons, chips, avatars,
  typography scale, and the color scheme picker.

---

## Non-visual improvements

- **Cancellation guards** on every `useEffect` data fetch:
  `let cancelled = false; ...; return () => { cancelled = true; };`
- **ObjectId validation** (`/^[0-9a-fA-F]{24}$/.test()`) before API calls
  that require a Mongo `_id`, so bad URLs fail fast with a readable error.
- **Legacy image URL fallback** — templates & memes uploaded pre-Cloudinary
  still resolve via a `getImageUrl` helper that detects `/uploads/` paths.
- **Empty vs error states** — every loader renders one of three:
  `LoadingSpinner` (in-flight), `ErrorState` (failed), `EmptyState`
  (success but nothing to show). No page shows a blank surface.
- **Role & permission helpers** — Collaboration pages centralise
  `isOwner()`, `myRole()`, `canCreateVersion()`, `canInvite()`.
- **Admin guard** on ModerationDashboard: non-admin users see a friendly
  `ErrorState` instead of a partially-rendered page.

---

## Deployment

Both frontend and backend deploy to Vercel from this monorepo.

- Frontend: `memestack/frontend` — CRA build, deploy as static output.
- Backend: `memestack/backend` — Express app exposed via serverless handler
  (`api/index.js`).
- Secrets (MongoDB URI, JWT secret, Cloudinary keys) set in Vercel env;
  `.env` files stay local and are gitignored.

See **README_DEPLOYMENT.md** for the step-by-step runbook.

---

## What was intentionally NOT changed

- Backend data models, schemas, and route contracts.
- Auth flow (JWT + cookie) — only the visuals around it.
- Cloudinary upload logic.
- Third-party integrations (OpenAI moderation hook, etc.).

If any backend tweak is needed later, the frontend contract is documented
per-page inline in the JSDoc header at the top of each `src/pages/*.js`
file.
