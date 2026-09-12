import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { spawnSync } from 'child_process'

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

/**
 * The cut's own directory, and the repository above it. Derived from NOTES_DIR
 * so there is one path to keep pointed at the videos project, not two.
 */
const VIDEO_DIR = path.dirname(NOTES_DIR)
const VIDEO_REPO = path.dirname(path.dirname(VIDEO_DIR))

/**
 * The cut whose action cues this one carries forward. The retime step reads the
 * earlier cut's lines and actions and maps them onto the new line times; see
 * HANDOFF-cut-02-presentation.md, "The pipeline".
 */
const CARRIED_FROM = 'cut-01'

/** Read a JSON file, or throw with the path in the message. */
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    throw new Error(`${file}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * Run one step of the pipeline from the cut's directory, and return its output
 * whether it worked or not. The clip editor shows the failing step's own words:
 * a join that rejects a trim says why, and paraphrasing it would lose that.
 */
const runStep = (args) => {
  // Through a shell, and quoted: spawning node directly from the dev server on
  // this machine dies with Windows' 0xC0000142 (DLL init failed) before the
  // script runs, with nothing on either stream to say so. The shell starts it
  // happily, and the quotes are for the space in "C:\Program Files\nodejs".
  const quote = (a) => (/[\s&|<>^]/.test(a) ? `"${a}"` : a)
  const r = spawnSync(quote(process.execPath), args.map(quote),
    { cwd: VIDEO_DIR, encoding: 'utf8', maxBuffer: 1 << 26, shell: true, windowsHide: true })
  const out = [r.error ? String(r.error) : '', r.stdout || '', r.stderr || ''].join('').trim()
  return { ok: r.status === 0, out: `$ node ${args.join(' ')}\n${out || `exit ${r.status}, no output`}` }
}

/**
 * One join, retime and copy, in that order, for the cut `name`. Everything
 * downstream of a placement change has to run, because the line times move.
 */
const rebuild = (name) => {
  const log = []
  const steps = [
    [
      path.join(VIDEO_REPO, 'tools/takes/place-lines.mjs'), 'join',
      '--placement', `cues/${name}-placement.json`,
      '--out', `masters/${name}`,
      '--lines-out', `cues/${name}-lines.json`,
    ],
    [
      path.join(VIDEO_REPO, 'tools/script-table/retime-actions.mjs'),
      '--from-lines', `cues/${CARRIED_FROM}-lines.json`,
      '--from-actions', `cues/${CARRIED_FROM}-actions.json`,
      '--to-lines', `cues/${name}-lines.json`,
      '--map', `cues/${name}-actions-map.json`,
      '--extra', `cues/${name}-actions-extra.json`,
      '--out', `cues/${name}-actions.json`,
    ],
  ]
  for (const args of steps) {
    const step = runStep(args)
    log.push(step.out)
    if (!step.ok) return { ok: false, log: log.join('\n\n') }
  }
  const scripts = path.resolve(__dirname, 'public/scripts')
  fs.mkdirSync(scripts, { recursive: true })
  for (const [from, to] of [
    [path.join(VIDEO_DIR, 'cues', `${name}-actions.json`), `${name}.json`],
    [path.join(VIDEO_DIR, 'cues', `${name}-lines.json`), `${name}-lines.json`],
    [path.join(VIDEO_DIR, 'masters', `${name}.m4a`), `${name}.m4a`],
  ]) fs.copyFileSync(from, path.join(scripts, to))
  log.push(`copied ${name}.{json,m4a} and ${name}-lines.json into public/scripts`)
  return { ok: true, log: log.join('\n\n') }
}

/** One rebuild at a time: two joins over the same outputs would interleave. */
let rebuilding = false

/**
 * Dev-server only: the clip editor's backend.
 *
 * `GET /__clip/<name>/<id>` is everything the editor needs to draw one line's
 * clip - the split's record of it (`clips.json`), the placement entry, the
 * effective trim the last join actually used (`<name>-effective.json`), and the
 * two neighbours so the joins either side can be seen. `GET .../audio` is the
 * clip's WAV, decoded in the browser for the waveform and the preview, so
 * scrubbing a handle costs no round trip.
 *
 * `POST /__clip/<name>/<id>` with `{ trim, gap, cuts }` writes that entry back
 * into the placement and runs join, retime and the copy into public/scripts.
 */
const clipEditor = {
  name: 'color-taylor-clip-editor',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const m = /^\/__clip\/([\w-]+)\/(\d+\.\d+)(\/audio)?\/?(?:\?.*)?$/.exec(req.url || '')
      if (!m) return next()
      const [, name, id, audio] = m
      const send = (status, body) => {
        res.statusCode = status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      }
      const placementPath = path.join(VIDEO_DIR, 'cues', `${name}-placement.json`)

      /** The split's record, the placement, and the last join's effective trims. */
      const load = () => {
        const placement = readJson(placementPath)
        const clipsDir = path.resolve(path.dirname(placementPath), placement.clipsDir)
        const clips = readJson(path.join(clipsDir, 'clips.json')).clips
        const effFile = path.join(VIDEO_DIR, 'cues', `${name}-effective.json`)
        const eff = fs.existsSync(effFile) ? readJson(effFile).clips : []
        return { placement, clipsDir, clips, eff }
      }

      try {
        if (req.method === 'GET' && audio) {
          const { clipsDir, clips } = load()
          const c = clips.find((x) => x.id === id)
          if (!c) return send(404, { error: `no clip ${id}` })
          const file = path.join(clipsDir, c.file)
          const buf = fs.readFileSync(file)
          res.statusCode = 200
          res.setHeader('content-type', 'audio/wav')
          res.setHeader('cache-control', 'no-store')
          res.setHeader('content-length', String(buf.length))
          return res.end(buf)
        }

        if (req.method === 'GET') {
          const { placement, clips, eff } = load()
          const i = clips.findIndex((x) => x.id === id)
          if (i < 0) return send(404, { error: `no clip ${id}` })
          const pi = placement.clips.findIndex((x) => x.id === id)
          const byId = (list, k) => list.find((x) => x.id === k) ?? null
          // A neighbour is drawn faintly at the edge, so it needs its audio and
          // the trim that decides which end of it is heard - nothing more.
          const neighbour = (k) => {
            const c = clips[k]
            if (!c) return null
            const e = byId(eff, c.id)
            return {
              id: c.id, text: c.text, full: +(c.origEnd - c.origStart).toFixed(3),
              trim: e?.trim ?? null, gap: byId(placement.clips, c.id)?.gap ?? null,
              audio: `/__clip/${name}/${c.id}/audio`,
            }
          }
          const c = clips[i]
          return send(200, {
            name,
            id,
            beat: c.beat,
            line: c.line,
            text: c.text,
            file: c.file,
            full: +(c.origEnd - c.origStart).toFixed(3),
            lineStart: c.lineStart,
            lineEnd: c.lineEnd,
            words: c.words ?? [],
            audio: `/__clip/${name}/${id}/audio`,
            placement: pi < 0 ? null : placement.clips[pi],
            effective: byId(eff, id),
            prev: neighbour(i - 1),
            next: neighbour(i + 1),
          })
        }

        if (req.method === 'POST') {
          let raw = ''
          req.on('data', (chunk) => { raw += chunk })
          req.on('end', () => {
            try {
              if (rebuilding) return send(409, { error: 'a rebuild is already running' })
              const body = JSON.parse(raw || '{}')
              const placement = readJson(placementPath)
              const entry = placement.clips.find((x) => x.id === id)
              if (!entry) return send(404, { error: `placement has no ${id}` })
              if (body.gap !== undefined) {
                const gap = Number(body.gap)
                if (!(gap >= 0)) return send(400, { error: `gap ${body.gap} is not zero or more` })
                entry.gap = +gap.toFixed(3)
              }
              if (body.trim !== undefined) {
                const t = body.trim || {}
                const trim = {}
                if (t.start !== undefined && t.start !== null && Number(t.start) > 0) trim.start = +Number(t.start).toFixed(3)
                if (t.end !== undefined && t.end !== null) trim.end = +Number(t.end).toFixed(3)
                if (Object.keys(trim).length) entry.trim = trim
                else delete entry.trim
              }
              if (body.cuts !== undefined) {
                const cuts = Array.isArray(body.cuts) ? body.cuts : []
                if (cuts.length) entry.cuts = cuts.map(([a, b]) => [+Number(a).toFixed(3), +Number(b).toFixed(3)])
                else delete entry.cuts
              }
              fs.writeFileSync(placementPath, JSON.stringify(placement, null, 2) + '\n')
              rebuilding = true
              let result
              try {
                result = rebuild(name)
              } finally {
                rebuilding = false
              }
              return send(result.ok ? 200 : 500, { ...result, entry })
            } catch (err) {
              rebuilding = false
              return send(500, { error: String(err) })
            }
          })
          return
        }
      } catch (err) {
        return send(500, { error: String(err) })
      }
      res.setHeader('allow', 'GET, POST')
      return send(405, { error: 'GET or POST' })
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), siteUrlHtml, presentationNotes, clipEditor],
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
