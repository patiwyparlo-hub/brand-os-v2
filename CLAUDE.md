@AGENTS.md

# Brand OS v2

Internal brand studio for Strategy: chat with brand guidelines and assets, and generate on-brand ad designs in the `/create` studio.

- Repo: https://github.com/patiwyparlo-hub/brand-os-v2 (private)
- Production: https://brand-os-v2-olive.vercel.app (Vercel project `knock-app/brand-os-v2`)
- Every push to `main` deploys to production. Any other branch or PR gets a Vercel preview URL.

## Running locally

```bash
./start.sh          # installs deps if needed, checks .env.local, starts dev server
PORT=3001 ./start.sh
```

Local preview: http://localhost:3000 (studio at http://localhost:3000/create). If 3000 is taken, `start.sh` uses the next free port and prints it.

Secrets live in `.env.local` (gitignored, never commit it). Needed keys: `ANTHROPIC_API_KEY`, `HIGGSFIELD_API_KEY`. Pull them from Vercel with `vercel env pull .env.local`. Without keys the app still runs, but the AI routes report that they are not configured.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 + CSS modules · `@anthropic-ai/sdk` · Higgsfield (image generation) · `html-to-image` (PNG export).

## Layout

- `app/page.tsx` — login screen or the brand chat (`components/Chat.tsx`)
- `app/create/page.tsx` — renders `components/Studio.tsx`, the design editor (brief → generated design → chat edits → PNG export)
- `app/api/*` — route handlers: `chat`, `generate-design`, `edit-design` (Claude), `generate-image` (Higgsfield), `assets`, `guidelines`, `session`
- `lib/` — `anthropic.ts`, `higgsfield.ts` clients; `session.ts` cookie session (`brandos_user`, roles `internal` / `external`); `recents.ts`; `types.ts`
- `data/` — static brand guidelines and asset catalog
- `components/formats.ts` — ad formats and their true export pixel sizes
- `public/brand/` — logos; `design-reference/` — local-only design refs (untracked)

## Checks before committing

```bash
npx tsc --noEmit
npm run build
npm run lint
```

`tsc` and `build` must pass. `lint` already has pre-existing errors (mostly `react-hooks/set-state-in-effect`); don't add new ones, and fix old ones only in files you are already touching.

## Conventions

- Language: all documentation, GitHub issues, PRs, issue/PR comments, commit messages and code comments are written in English.
- Branch per change: `issue-<n>-<short-slug>` for issue work; `/issue-to-pr <n>` automates the flow.
- Commit messages: short imperative subject in English, like the existing history ("Make Recent list live and shorten CTA to \"Generate\"").
- Don't push straight to `main` unless asked — it goes to production.
- Keep the visual language in `Studio.module.css` / `CreateScreen.module.css`; brand orange and logos come from `public/brand/`.
