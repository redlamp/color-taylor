import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const base = process.env.GH_PAGES_DEV
  ? '/color-taylor/dev/'
  : process.env.GITHUB_PAGES
    ? '/color-taylor/'
    : './'

/**
 * Absolute origin + path of the deployed site, for the `%SITE_URL%` token in
 * index.html.
 *
 * The Open Graph tags cannot use `%BASE_URL%`. og:image and og:url are read by
 * scrapers that never loaded the page - WhatsApp, Discord, Slack, Bluesky - and
 * most of them will not resolve a relative URL against the document, so a
 * `/color-taylor/og-image.jpg` value silently yields a card with no image. They
 * have to be fully qualified.
 *
 * The default `./` build has no origin to speak of, so it falls back to the
 * production URL: a local or file:// preview is never scraped, and pointing the
 * tags at the live site is more useful than emitting a broken one.
 *
 * `SITE_URL=... vite build` overrides it. That exists for one job: pointing a
 * build at a temporary public origin - a Cloudflare or ngrok tunnel over
 * `vite preview` - so the real scrapers can be tested against a card that is
 * not yet on the live site. Without the override they would fetch the
 * production URL and report on whatever is deployed there instead. Include the
 * trailing slash; the image is appended to it.
 */
const SITE_URL =
  process.env.SITE_URL ||
  'https://redlamp.github.io' + (base.startsWith('/') ? base : '/color-taylor/')

/** Fills `%SITE_URL%` in index.html, the way Vite itself fills `%BASE_URL%`. */
const siteUrlHtml = {
  name: 'color-taylor-site-url',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), siteUrlHtml],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
          if (id.includes('@base-ui-components')) return 'baseui'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('sonner')) return 'sonner'
          if (id.includes('@fontsource')) return 'fonts'
          return 'vendor'
        },
      },
    },
  },
})
