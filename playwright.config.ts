import { defineConfig, devices } from '@playwright/test';

/*
 * Where the suite points, and whether it starts a server of its own.
 *
 * By default: localhost:5173, reusing a `bun dev` that is already up. That
 * reuse is the documented trap in the root CLAUDE.md - the suite runs against
 * whatever is already listening - and it has a sharper edge than a stray .env:
 * a dev server that has lost track of the file watcher keeps serving a stale
 * bundle, and the suite then passes against an app that no longer exists. Set
 * BASE_URL to aim somewhere known instead, which is what `vite preview` on its
 * own port is for.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    /*
     * Every context starts having seen the welcome panel. It is modal, so on a
     * first visit it covers the app and eats the first click of whatever test
     * is running - which is a thing to assert on purpose, not to meet by
     * accident in all seventy of them. `tests/about-panel.spec.ts` clears it
     * and checks the real first-run behaviour; the specs that call
     * localStorage.clear() set it again themselves, since clear takes it too.
     */
    storageState: './tests/storage-state.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Nothing to start when the suite has been aimed at a server by hand.
  webServer: process.env.BASE_URL ? undefined : {
    command: 'bun dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
