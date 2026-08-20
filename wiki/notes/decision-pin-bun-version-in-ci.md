---
tags:
  - domain/bundle
  - status/adopted
  - origin/user-call
---

# Pin The Bun Version In CI

**2026-08-20.** Both CI jobs name an exact `bun-version: 1.4.0` instead of `latest`, and the local toolchain moved from 1.3.11 to match.

## Why

Bun 1.4.0 was published at 14:07 UTC on 2026-08-20. `.github/workflows/ci.yml` asked for `bun-version: latest` in both the test and deploy jobs, so the pipeline adopted a major release about two hours after it existed — nobody chose it, and no machine here was on the same version to reproduce a failure. The skew ran backwards, CI ahead of the developer, which is the direction that produces a red build you cannot repeat locally.

So the decision is less "upgrade to 1.4" than "stop the toolchain moving on its own". The upgrade was going to happen regardless; the pin is what makes it a choice.

## What the upgrade actually touches

Nothing that ships. Bun is only the package manager and script runner in this repo — vite, tsc, eslint and Playwright all resolve through their `#!/usr/bin/env node` shebangs and run under Node 22. Nothing in `src/` or `scripts/` calls a Bun runtime API, and the only `bun build` anywhere is the manual three.js re-vendor step in `docs/prototypes/rgb-cube/vendor/README.md`, which CI never runs. The long "Upgrading to 1.4" list — Temporal, `bun:ffi`, `fetch()` header joining, `node:tls`, the WebSocket argument validation — reaches none of it.

## The lockfile did not churn

Worth recording because the release notes imply otherwise. New lockfiles in 1.4 are `lockfileVersion: 2`, and the notes say to run `bun install` to migrate — but an existing lockfile keeps its version. `bun install` reported no changes, and a deliberate full rewrite with `bun install --lockfile-only` produced a byte-identical file, still `lockfileVersion: 1`, `configVersion: 0`.

The linker default is sticky the same way: `configVersion: 0` means the hoisted `node_modules` layout stays, so 1.4's new isolated-linker default only applies to projects created under it. Nothing to commit, and `bun.lock` is still readable by bun 1.3.

## Rejected

- **Stay on 1.3.11 and wait for 1.4.1.** Defensible, but only if CI is pinned to 1.3.11 *first*. Leaving `latest` and waiting is not waiting — it is running 1.4.0 without saying so.
- **Force the lockfile to v2.** Its two extra parse-time checks cover dependency kinds this project doesn't have: npm packages resolved to a tarball outside the configured registry, and git dependencies with path traversal in the entry. All 568 packages come from the registry.

## Cost

Bun updates are now a deliberate edit to the workflow file, and CI will keep using 1.4.0 until someone changes it. Acceptable — dependencies here already move by hand, and `bun.lock` is the source of truth for everything else.

## Verified

`lint`, `typecheck`, `build`, `build:figma`, `preview:card`, and 39/39 Playwright specs, all on 1.4.0. The POSIX inline `GITHUB_PAGES=1 vite build` form that `deploy` and [[decision-link-preview-card]] rely on still works under bun's own shell on Windows.
