---
tags:
  - domain/bundle
  - status/adopted
  - origin/user-call
---

# Decision: The Deploy Waits For The Fast Checks, Not The Whole Suite

**2026-09-08.** A push to main publishes to GitHub Pages once lint, the type check and the unit tests pass - about a minute. The Playwright suite runs beside them on main and does not hold the deploy. Pushes to dev no longer run CI at all; the pull request does.

## Why

Shipping a change meant: merge, then wait about seven minutes for one `test` job to run everything - the e2e suite most of it - on the merge commit, then two more for the deploy. The e2e had just run on the same commit on the pull request, and on dev a second time, on two runners at once. The gate was real but it was paying for the same answer three times.

Taylor asked to tighten the span between "ship it" and it being on the site. Three shapes were on the table:

- **No gate on main.** Deploy the moment main moves. Fastest, but a merge that skipped the PR's checks could publish a broken build - which is the exact failure the single-workflow gate was built to stop, see the note at the top of `ci.yml`.
- **Keep the gate, speed the suite.** Shard the e2e and drop the duplicate dev run. Halves the wait, changes nothing about safety, still leaves the deploy behind a rerun of tests the PR already ran.
- **A fast gate.** The cheap checks hold the deploy; the e2e runs alongside. Chosen.

## What the gate still catches

Lint, types and the pure colour maths run on every push to main before anything publishes. The e2e gates the merge - on the pull request, where it belongs, on the commit that will be merged. What a red e2e on main means now is "fix forward or revert", not "the site is still on the last good build". That is the trade, and it is the right one for a one-person project whose PRs are opened and merged by the same hands minutes apart.

## Rejected

- **`workflow_run` from a separate deploy file** - rejected before, for the reasons still in `ci.yml`'s header.
- **Skipping the e2e on main when the PR passed** - would need the merge commit's tree matched against a PR run's; more machinery than the minute it saves.
