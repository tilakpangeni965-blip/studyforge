# StudyForge

StudyForge is a student study workspace with Supabase-backed subjects and notes, a Pomodoro timer, and an AI tutor powered primarily by the hosted DeepSeek API, with an optional Gemini fallback.

## Local setup

1. Install Node.js 20.9 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL, Supabase anon key, and server-only `DEEPSEEK_API_KEY`. Never prefix this key with `NEXT_PUBLIC_` or commit `.env.local`.
4. Review and apply the Supabase migrations in order in the Supabase SQL editor: `0001_notes.sql` through `0009_flashcards.sql`.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

Migrations `0001`–`0003` create notes and tutor data and enable subject/note realtime updates. Migration `0004` enables private tutor image storage, `0005` creates practice quizzes, `0006` removes quiz generation quotas, and `0007` restricts new tutor uploads to images while voice input is paused. Migration `0008` adds private files for subjects, and `0009` adds student-owned flashcard decks and cards. The app does not run migrations automatically.

## AI tutor data use

Tutor requests run on the server, so students do not download or run either model. DeepSeek receives the student's current question, up to 30 earlier messages from that same thread, the selected subject name, and an attached image when provided. If a DeepSeek tutor request fails and `GEMINI_API_KEY` is configured, the same request is sent to Gemini as a fallback. Gemini is not used for quiz generation. The student's email, profile, and other threads are not included. API keys remain on the server. The default models are `deepseek-flash` and `gemini-3.1-flash-lite`; set `DEEPSEEK_MODEL` or `GEMINI_MODEL` on the server to choose another supported model. Image input is supported; voice input is paused. Google may use content submitted on Gemini's free tier to improve Google products; review Google's current data terms before enabling the fallback.

The tutor is limited to five requests per student per minute using the database procedure from migration `0002`. If that procedure has not been applied or is unavailable, the app uses a per-process fallback, which is not a shared limit across server instances.

## Data-backed features

- Subjects use the existing `public.subjects` table and refresh from Supabase Realtime, with a 15-second polling fallback.
- Subject course files are private in Supabase Storage and linked to each subject. Supported uploads include PDFs, text/CSV, DOCX/PPTX/XLSX, and JPG/PNG/WebP images up to 20 MB each.
- Notes support creating, searching, editing, pinning, and deleting private notes. They also refresh through Supabase Realtime when migration `0003` is applied.
- Flashcards support private decks linked optionally to a subject, adding and deleting cards, and studying cards by revealing the answer. Migration `0009` creates the required tables.
- Tutor conversations and messages are private per account under row-level security.
- Account email and password changes require the fresh reauthentication code sent to the student's current sign-in email. Email changes may also require confirmation at the new address, depending on the project's Auth settings. The Supabase email templates and SMTP configuration determine code delivery and sender address.
- Focus timer state is temporary; focus history is not saved yet.
- Focus sessions are not saved, so analytics does not yet report focus time or study streaks. Theme, reminders, notification permission, and account export are available in Settings; preferences are stored in the current browser.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```
