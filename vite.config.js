import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

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

/**
 * Where presentation-mode notes are kept (`?present=<name>`, see
 * docs/demo-script.md). One JSON file per cut, `<name>-notes.json`, beside the
 * cut's other cue files in the videos repo; `PRESENTATION_NOTES_DIR` moves it.
 */
const NOTES_DIR =
  process.env.PRESENTATION_NOTES_DIR ||
  'C:\\workspace\\redlamp-videos\\videos\\color-taylor-demo-test\\cues'

/**
 * Dev-server only: `GET/POST /__notes/<name>` reads and writes that file as
 * `{ "source": "<name>", "notes": [...] }`. The dev tool has no other backend,
 * and a file the video project can read is the whole point of the notes.
 */
const presentationNotes = {
  name: 'color-taylor-presentation-notes',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const m = /^\/__notes\/([\w-]+)\/?(?:\?.*)?$/.exec(req.url || '')
      if (!m) return next()
      const name = m[1]
      const file = path.join(NOTES_DIR, `${name}-notes.json`)
      const send = (status, body) => {
        res.statusCode = status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      }
      if (req.method === 'GET') {
        try {
          if (!fs.existsSync(file)) return send(200, { source: name, notes: [] })
          const data = JSON.parse(fs.readFileSync(file, 'utf8'))
          return send(200, { source: name, notes: Array.isArray(data.notes) ? data.notes : [] })
        } catch (err) {
          return send(500, { error: String(err) })
        }
      }
      if (req.method === 'POST') {
        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(raw || '{}')
            const notes = Array.isArray(data.notes) ? data.notes : null
            if (!notes) return send(400, { error: 'body needs a notes array' })
            fs.mkdirSync(NOTES_DIR, { recursive: true })
            const doc = { source: name, notes }
            fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
            return send(200, doc)
          } catch (err) {
            return send(500, { error: String(err) })
          }
        })
        return
      }
      res.setHeader('allow', 'GET, POST')
      return send(405, { error: 'GET or POST' })
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), siteUrlHtml, presentationNotes],
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
