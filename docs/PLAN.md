# StudyForge — Implementation Plan

**Branch:** `feature/ui-redesign-and-ai-tutor` (cloned fresh from GitHub into `E:\studyforge-redesign`)
**Approved scope:** redesign every page · notes real end-to-end · AI Tutor with Gemini and persistent conversations · honest empty states everywhere else
**Never:** reset the database, run migrations automatically, push to `main`, or print secrets.

---

## Database support audit (which features already have real tables)

| Feature | Real table? | Verdict |
|---|---|---|
| Subjects | ✅ `public.subjects` | Already real. Keep and polish. |
| Profiles | ✅ `public.profiles` | Already real. |
| Notes | ❌ | **Build for real** — migration `0001_notes.sql`. |
| AI Tutor | ❌ | **Build for real** — migration `0002_tutor_conversations.sql`. |
| Flashcards | ❌ | Honest empty state. No table, no fake decks. |
| Practice | ❌ | Honest empty state. No fake quizzes. |
| Focus sessions | ❌ | Live Pomodoro stays; history shows an honest empty state. |
| Tasks | ❌ | Honest empty state / local-only checklist, clearly labelled. |
| Analytics | ❌ | Only real numbers shown (subjects, notes). Fake chart removed. |

---

## Phase 2 — UI redesign

### Group A — foundation (tokens + primitives, no behaviour change)
- Design tokens in `app/globals.css`: surface/border/text/accent/status scales, radii, shadows, focus ring, motion durations. Semantic, themeable — no more hardcoded `#0b0b0f` / `white/8` scattered across 15 files.
- `lib/utils/cn.ts` — class merge helper (no new dependency; small local implementation).
- New primitives under `components/ui/`: `Button` (variants, sizes, loading, disabled), `Input`, `Textarea`, `Select`, `Modal` (focus trap, Escape, scroll lock, `aria-modal`), `EmptyState`, `Skeleton`, `Badge`, `Stat`, `SectionHeader`, `Spinner`, `Toast`.
- Refactor `Card` (fix default `as="section"` mismatch, add surface variants) and `ProgressBar` onto tokens.
- Fix heading hierarchy so every page has a sane `h1 → h2 → h3` outline.
- Fix the `typecheck` script: `next typegen && tsc --noEmit` (bare `tsc` fails on a fresh clone).
- Remove the stray `[TEMPLATE]` line in `.env.example`; add `GEMINI_API_KEY`.

### Group B — app shell
- Fix the dead `/ai-tutor` → `/tutor` link in `Sidebar.tsx` and `Header.tsx`; add the missing `/tutor` header title.
- Real user menu (profile, settings, sign out) replacing the inert profile button. Notification bell removed rather than left dead.
- Correct active states, breadcrumbs, mobile drawer polish, keyboard pass.
- Fix the `useAuth` re-subscribe storm (module-level singleton Supabase browser client) and the same bug in `useSubjects` and the dashboard readers.

### Group C — dashboard
- `StatsGrid`: real subjects count and notes count; streak/focus/goal either real or removed — no hardcoded zeros presented as data.
- `WeeklyProgress`: real numbers or an honest empty state.
- Fix the corrupted emoji (`"�"`).
- `TaskList`: local-only checklist, clearly labelled as device-local, or removed.

### Group D — feature pages
- `/subjects`: toast instead of `alert`, real confirm dialog instead of `confirm()`, subject detail view, real progress.
- `/notes`: **full CRUD** against the new `notes` table — list, search, create, edit, delete, pin, subject link, loading/empty/error/success states.
- `/flashcards`, `/practice`, `/analytics`, `/focus`, `/settings`: real data where it exists, honest "not connected yet" empty states where it does not, every button either working or removed. No inert controls.
- `error.tsx`, `not-found.tsx`, `loading.tsx` at the app level.

### Group E — motion and responsive pass
- Subtle transitions on interaction only, reduced-motion respected, 360/768/1280 review, contrast and keyboard focus audit.

---

## Phase 3 — AI Tutor (Gemini), in stages

- **Stage 0** — add `@google/genai`, add server-only `GEMINI_API_KEY` to `.env.local` and Vercel. Key never reaches client code, never in `NEXT_PUBLIC_*`, never in git.
- **Stage 1** — `app/api/tutor/chat/route.ts`: Supabase server client → `getUser()`, 401 when unauthenticated; input validation and length caps; per-user rate limit; `runtime = "nodejs"`; streamed response; provider errors mapped to safe messages with no key or stack leakage.
- **Stage 2** — tutor UI: streaming message list, markdown/code rendering, working suggested prompts, subject selector, stop/regenerate, retry, disabled states, and an explicit "AI-generated — verify with your textbook" label.
- **Stage 3** — persistence: conversations and messages saved to the new tables, scoped by the authenticated user id, with thread list, rename, delete, and private-only access.
- **Stage 4** — grounding and adaptation: curated verified lesson content bundled in-repo and clearly marked as verified source material, plus mistake/feedback signals that steer follow-up explanations.

Model selection happens against the provider's live model list at Stage 0 — no invented model IDs.

---

## Phase 4 — Vercel and quality

- Real README (setup, env var names, migrations, deploy), fixed `.env.example`, `typecheck` script, Node `engines` pin.
- Server/client boundary check, production build, auth redirect check, Supabase-connected route check.
- Vercel env var list documented; no secrets committed; no production deploy without explicit approval.

---

## Verification at every group boundary

```
npm run typecheck   # next typegen && tsc --noEmit
npm run lint
npm run build
```

Plus a real browser pass on the affected routes. Each group is committed separately on the feature branch, so any group can be reviewed or reverted independently.

---

## What the user must do (cannot be done from here)

1. Run `supabase/migrations/0001_notes.sql` then `0002_tutor_conversations.sql` in the Supabase SQL editor, after reviewing them.
2. Add `GEMINI_API_KEY=<key>` to `.env.local` and to Vercel's environment variables. The key must be added by the user, never pasted into chat and never committed.
