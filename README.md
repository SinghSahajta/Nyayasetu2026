# NyayaSetu: Civic Issue Reporting & Resolution Tracker

**siNUsoid · PS 9.** Citizens pin a civic issue on the map (pothole, garbage, dead streetlight…). NyayaSetu
**scores its priority automatically and explains every point**, routes it to the right department, and shows
the public its progress from *reported* to *resolved*, without ever learning who the citizen is.

> Built on [nyayasetu-sinusoid](https://github.com/Aarav241020/nyayasetu-sinusoid) (the PS 9 version), with scheme
> discovery and the ward heatmap carried over from [Nyayasetu](https://github.com/vanoopkumar261-star/Nyayasetu).

## What it does

| | |
|---|---|
| **Anonymous by design** | No name, no account. A phone is verified by OTP and then discarded unless the citizen ticks "let the assigned officer call me". The only way back to a complaint is its tracking ID. See [Privacy](#privacy). |
| **Geo-tagged reporting** | Map pin or GPS (India only), photo, address auto-filled from the pin. Similar open reports within 150 m are shown before you submit, so people *confirm* instead of duplicating. |
| **Explainable priority (0–100)** | Five factors with fixed weights and a written reason for each (see below). A "why this priority?" popover is on every issue. Officers' queues are sorted by it. |
| **Public tracker** | `/issues` map + ranked list, `/issues/<ID>` with a reported → assigned → work started → resolved stepper, score breakdown, deadline countdown, timeline and before/after photos. No login needed. |
| **Accountability** | Per-category deadlines (SLA); overdue issues auto-escalate to a supervisor and that shows publicly. `/stats` publishes on-time rate and average fix time per city and category, plus a per-city **accountability score** (resolved 40 · on time 35 · not overdue 25, graded A–D). |
| **Tamper-evident audit log** | Every status change is hash-chained in Postgres (each row stores the sha256 of the previous one). `/issues/<ID>` shows whether the chain is intact. It detects edits and deletions; it cannot prevent them. |
| **RTI draft** | For escalated or overdue issues, one click drafts a Section 6(1) RTI application (Groq, with a template fallback). It uses the blurred location, never the exact pin. |
| **Scheme discovery** | 30 welfare schemes, a rule-based "find schemes for you" questionnaire, and an AI advisor that answers only from the schemes in the database. |
| **Ward heatmap** | Supervisors see where open issues cluster, by priority. |
| **Also** | Report by chatting in Hindi or English (`/chat`) · "I see this too" confirmations · officer least-load auto-assignment · installable PWA · English/Hindi UI on every citizen page · light and dark themes. |

## The priority score

`lib/priority.ts` is a pure, unit-tested function. All weights live in one `WEIGHTS` constant.

| Factor | Max | How |
|---|---|---|
| Severity | 35 | An LLM rates harm 1–5 from the **description and photo**, blended 70/30 with a per-category baseline. No API key → baseline + urgent keywords. |
| Reports & confirmations | 25 | Similar open reports within 150 m (last 14 days) + confirmations, on a **log scale** so spam can't buy the top slot. |
| Location sensitivity | 20 | Hospitals (6), schools (5), main roads (5), markets (2), bus stops (2) within 250 m, from **OpenStreetMap**. |
| Time pressure | 15 | Share of the resolution deadline used; overdue = full points. |
| Seasonal risk | 5 | Drains, sewers, water and mosquito issues during the monsoon (Jun–Sep). |

Bands: **P1 Critical ≥ 70 · P2 High ≥ 50 · P3 Medium ≥ 30 · P4 Low.** Scores are recalculated on filing, on each
confirmation, on status changes, and by the cron job (time pressure grows on its own).

## Privacy

The citizen is never asked for a name, and the database holds no citizen accounts.

- **Phone:** verified by OTP, then the OTP record is deleted. It is saved on the complaint only if the citizen opts in, is shown to the assigned officer only (not supervisors, not the public), and a database trigger erases it when the complaint is resolved or closed.
- **Location:** public pages and the RTI draft show a point snapped to a ~220 m grid, with house numbers and landmark removed and nearby distances rounded to 50 m. Only the assigned officer sees the exact pin.
- **Tracking ID:** the only way back to a complaint. It is shown once on filing, and nothing on our side can recover it.
- **"I see this too":** de-duplicated per browser (a random id in local storage), not per person.
- **Abuse limits:** OTP requests, filings and confirmations are rate-limited per IP (in memory, so per server instance; move to Redis if scaled out).
- **Row Level Security:** every table has RLS on with no policies, and the `anon`/`authenticated` roles have no grants. All data access is server-side with the service-role key; the browser never talks to Supabase.

## Run it locally

Needs Node 20+ and a Supabase project (the free tier is fine).

```bash
git clone https://github.com/SinghSahajta/Nyayasetu2026 && cd Nyayasetu2026
npm install
cp .env.local.example .env.local      # fill in the keys below
```

1. **Database:** in Supabase → SQL Editor, run the files in `supabase/migrations/` **in order**, each as its own query. Paste the file's contents, not its name: `0001_init`, `0002_schemes`, `0003_audit_chain`, `0004_anonymous_citizens`, `0005_lock_down_rls`.
2. **Data:**
   ```bash
   npm run seed:schemes                  # the 30 welfare schemes
   npm run seed:demo -- --yes            # staff logins + 7 demo issues (WIPES existing complaints and users)
   ```
   `--limit=N` seeds more issues (up to 44, about a second each for the OpenStreetMap lookups).
3. **Start:** `npm run dev` → http://localhost:3000

Demo logins (at `/login`): `officer@nyayasetu.in` / `Officer@123` (Roads) · `supervisor@nyayasetu.in` / `Super@123`.
While `OTP_MOCK_MODE=true` no SMS is sent: the code is shown on screen (and printed in the terminal).

Run the cron by hand: `curl http://localhost:3000/api/cron/escalate`.

### Environment

| Variable | Needed | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server only. Never expose it to the browser. |
| `JWT_SECRET` | yes | Any long random string. Signs OTP sessions and staff logins. |
| `OTP_MOCK_MODE` | for demos | `true` shows the OTP on screen instead of sending an SMS. Wire in an SMS provider in `lib/otp.ts` before real use. |
| `GROQ_API_KEY` | optional | Free key from console.groq.com. Powers AI severity, chat-to-report, the scheme advisor and the RTI draft. Without it everything falls back to rules and templates. |
| `GROQ_CHAT_MODEL`, `GROQ_VISION_MODEL` | optional | Model overrides. |
| `CRON_SECRET` | optional | Protects `/api/cron/escalate` with `Authorization: Bearer <secret>`. |

Keys live only in `.env.local` (git-ignored). Set them again in your hosting provider's environment settings when you deploy.

## Checks

```bash
npm test          # priority engine tests
npm run test:e2e  # full flow against a running dev server; needs the fuller demo data: npm run seed:demo -- --yes --limit=44
npx tsc --noEmit  # types
npm run lint
npm run build
```

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind (class-based dark mode) · Supabase (Postgres + Storage) ·
Leaflet + OpenStreetMap · Groq via the OpenAI SDK · react-i18next (English/Hindi) · Recharts.
