---
description: Take a GitHub issue, implement it on a branch, and open a PR with a Vercel preview
argument-hint: <issue number or URL>
allowed-tools: Bash(gh:*), Bash(git:*), Bash(npm:*), Bash(npx:*), Read, Edit, Write, Grep, Glob
---

Turn GitHub issue **$ARGUMENTS** of `patiwyparlo-hub/brand-os-v2` into a pull request.

1. **Read the issue.** `gh issue view $ARGUMENTS --comments`. If no issue number was given, run `gh issue list` and ask which one. If the issue is unclear or too big for one PR, stop and say what is missing instead of guessing.
2. **Branch.** `git status` must be clean (otherwise stop and ask). Then `git switch main && git pull` and `git switch -c issue-<n>-<short-slug>`.
3. **Implement.** Follow CLAUDE.md and AGENTS.md (this Next.js version differs from what you know — check `node_modules/next/dist/docs/` before using Next APIs). Keep the change scoped to the issue.
4. **Check.** `npx tsc --noEmit` and `npm run build` must pass. Run `npm run lint` and make sure you added no new errors. If the change is visual, start the app (`./start.sh`) and look at the affected screen.
5. **Commit.** Short imperative subject; body ends with `Closes #<n>`. Never commit `.env*` files or `.vercel/`.
6. **Push and open the PR.** `git push -u origin HEAD`, then `gh pr create --base main` with a title from the issue and a body containing: what changed, how it was verified, and `Closes #<n>`.
7. **Report.** Give the PR URL. Vercel builds a preview for the PR; after a minute, `gh pr checks` or the PR page shows its URL — include it if it is ready.

Do not merge the PR and do not push to `main`: merging deploys to production, so that is the user's call.
