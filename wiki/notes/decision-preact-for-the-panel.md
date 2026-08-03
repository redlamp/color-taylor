---
tags:
  - domain/figma-plugin
  - domain/bundle
  - status/adopted
  - origin/user-call
---

# Decision: Preact In The Plugin Build Only

**2026-08-03.** The plugin build aliases `react` and `react-dom` to `preact/compat`. The app still ships React 19.

## Why

`react-dom` was 174 KB of the panel - reconciler, scheduler, synthetic event system, hydration - and none of it is tree-shakeable. `preact/compat` presents the same API over a ~15 KB runtime, so the shared source compiles unchanged and nothing forks.

The user's read: *"This plugin is very simple, so it doesn't seem like it needs all of react behind it."*

## The aliases

Five, not two. The automatic JSX transform emits imports from `react/jsx-runtime`, which a bare `react` rule doesn't catch:

- `react` and `react-dom` → `preact/compat`
- `react-dom/client` → `preact/compat/**client**` (not `preact/compat` - `createRoot` isn't there)
- `react/jsx-runtime` and `react/jsx-dev-runtime` → `preact/compat/jsx-runtime` / `jsx-dev-runtime`

## The ongoing risk

Asked directly by the user: does this make it harder to keep the plugin in sync with the app?

The honest answer is that it adds a compatibility surface that the app doesn't have. `preact/compat` covers hooks, context, refs, portals, `memo`, `forwardRef`, and class components including error boundaries - everything the picker uses today. It diverges on React internals: concurrent features, `useSyncExternalStore` edge cases, Suspense for data, and anything reading `__SECRET_INTERNALS`.

So the rule is: **the plugin build is a canary, not a fork.** If the app adopts a React 19 concurrent feature, the plugin build breaks loudly at build or first render rather than drifting. That is the cheap failure mode, and it is why this is acceptable. `bun run build:figma` should stay in the gate set for exactly this reason.

Related: [[decision-single-source-picker]], [[decision-lite-module-aliases]]
