import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { spawnSync, spawn } from 'child_process'

// The About panel shows the package version, so the two cannot drift: bump
// package.json and the panel follows at the next build.
const { version: appVersion } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))

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
 * cut's other cue files in the video pipeline's own working tree.
 *
 * Unset by default. The notes, frames and clip-editor routes below all 404
 * with `{ error: 'PRESENTATION_NOTES_DIR is not set' }` until this points at
 * that directory - set it in `.env.development.local`. Read through Vite's
 * own env loader rather than `process.env` alone: a `.env` file is not in the
 * process environment when this config is evaluated, and the routes are dev
 * server only, so the development file is the one that counts.
 */
const NOTES_DIR =
  process.env.PRESENTATION_NOTES_DIR ||
  loadEnv('development', process.cwd(), '').PRESENTATION_NOTES_DIR ||
  ''

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
      if (!NOTES_DIR) return send(404, { error: 'PRESENTATION_NOTES_DIR is not set' })
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
            // An empty list only replaces a file that has notes when the client says it
            // means to clear (the Clear button sends `clear: true`); anything else that
            // arrives empty, such as a stale page or a bad reload, is refused.
            if (notes.length === 0 && data.clear !== true && fs.existsSync(file)) {
              try {
                const cur = JSON.parse(fs.readFileSync(file, 'utf8'))
                if (Array.isArray(cur.notes) && cur.notes.length > 0) {
                  return send(409, { error: 'refusing to empty a notes file without clear: true', notes: cur.notes })
                }
              } catch { /* unreadable: fall through and overwrite */ }
            }
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
 * Dev-server only: `GET/POST /__frames/<name>` reads and writes the cut's
 * framing keyframes, `<name>-frames.json`, beside its other cue files.
 *
 * The file itself is a bare JSON array of keyframes - it is written by hand as
 * often as by the editor, and an array is what a frames file is. Over the wire
 * it wears the same envelope the notes do, `{ source, frames }`, and the same
 * rule: a list that arrives empty only replaces a file that has keyframes when
 * the client says it means it (`clear: true`), so a stale page cannot wipe a
 * set of frames by reloading.
 *
 * The app's own copy under `public/scripts/` is written too: the runner fetches
 * it from there, and an editor that saved only to the videos repo would need a
 * copy step before the change could be seen.
 */
const presentationFrames = {
  name: 'color-taylor-presentation-frames',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const m = /^\/__frames\/([\w-]+)\/?(?:\?.*)?$/.exec(req.url || '')
      if (!m) return next()
      const name = m[1]
      const file = path.join(NOTES_DIR, `${name}-frames.json`)
      const appCopy = path.join(server.config.root, 'public', 'scripts', `${name}-frames.json`)
      const send = (status, body) => {
        res.statusCode = status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      }
      const read = (f) => {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'))
        return Array.isArray(data) ? data : Array.isArray(data.frames) ? data.frames : []
      }
      if (!NOTES_DIR) return send(404, { error: 'PRESENTATION_NOTES_DIR is not set' })
      if (req.method === 'GET') {
        try {
          const from = fs.existsSync(file) ? file : fs.existsSync(appCopy) ? appCopy : null
          return send(200, { source: name, frames: from ? read(from) : [] })
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
            const frames = Array.isArray(data.frames) ? data.frames : null
            if (!frames) return send(400, { error: 'body needs a frames array' })
            if (frames.length === 0 && data.clear !== true && fs.existsSync(file)) {
              try {
                if (read(file).length > 0) {
                  return send(409, { error: 'refusing to empty a frames file without clear: true', frames: read(file) })
                }
              } catch { /* unreadable: fall through and overwrite */ }
            }
            const body = JSON.stringify(frames, null, 2) + '\n'
            fs.mkdirSync(NOTES_DIR, { recursive: true })
            fs.writeFileSync(file, body)
            fs.mkdirSync(path.dirname(appCopy), { recursive: true })
            fs.writeFileSync(appCopy, body)
            return send(200, { source: name, frames })
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
  const joinArgs = [
    path.join(VIDEO_REPO, 'tools/takes/place-lines.mjs'), 'join',
    '--placement', `cues/${name}-placement.json`,
    '--out', `masters/${name}`,
    '--lines-out', `cues/${name}-lines.json`,
  ]
  const planFile = path.join(VIDEO_DIR, 'cues', `${name}-plan.json`)
  if (fs.existsSync(planFile)) joinArgs.push('--plan', `cues/${name}-plan.json`)
  const steps = [
    joinArgs,
    [
      path.join(VIDEO_REPO, 'tools/script-table/retime-actions.mjs'),
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

/**
 * Where the pip re-cut's own script lives, and the per-cut flags a wrapper fixes for it -
 * crop-x, grade, which lines, `--to-track-end` - so an apply does not have to guess at options
 * that were measured once and belong to the cut, not to the request. A cut with no options file
 * has nothing to re-cut against and is left alone, the same as before this existed.
 */
const PIP_TOOL = path.join(VIDEO_REPO, 'tools/takes/cut-pip-clips.mjs')
const pipOptionsPath = (name) => path.join(VIDEO_DIR, 'cues', `${name}-pip-options.json`)

/**
 * Per-cut pip status, in memory only - it resets with the dev server, which is fine: a fresh
 * server has not re-cut anything yet, and the editor's log line is what a session actually
 * watches. `updating` while the child process runs, then `synced` or `error` with its output.
 */
const pipStatus = {}
const pipRunning = new Set()

/**
 * Re-cut the camera clip and its manifest for `name`, and copy both into the app - the other
 * half of "the camera footage moves with the lines" that `rebuild` above does not do. Started
 * after `rebuild` succeeds and left to run on its own: a full re-cut re-encodes video and can
 * take a while, and the apply that changed the line timing has already finished by the time this
 * is still going, so the response must not wait on it. `GET /__clip/<name>/status` is how the
 * editor finds out when it lands.
 */
function rebuildPip(name) {
  const optionsFile = pipOptionsPath(name)
  if (!fs.existsSync(optionsFile)) return // nothing measured for this cut yet
  if (pipRunning.has(name)) return // one re-cut at a time per cut; the next apply's will follow
  pipRunning.add(name)
  pipStatus[name] = { state: 'updating', log: '' }
  const args = [
    PIP_TOOL,
    '--placement', path.join(VIDEO_DIR, 'cues', `${name}-placement.json`),
    '--lines', path.join(VIDEO_DIR, 'cues', `${name}-lines.json`),
    '--segments', path.join(VIDEO_DIR, 'masters', `${name}-voice.segments.json`),
    '--options', optionsFile,
    '--out', path.resolve(__dirname, 'public/scripts/pip', name),
    '--manifest', path.join(VIDEO_DIR, 'cues', `${name}-pip.json`),
    '--copy', path.resolve(__dirname, 'public/scripts', `${name}-pip.json`),
  ]
  // Same shell workaround as runStep: spawning node directly from this dev server dies with
  // Windows' 0xC0000142 before the script runs.
  const quote = (a) => (/[\s&|<>^]/.test(a) ? `"${a}"` : a)
  const child = spawn(quote(process.execPath), args.map(quote), { cwd: VIDEO_DIR, shell: true, windowsHide: true })
  let out = ''
  child.stdout.on('data', (d) => { out += d })
  child.stderr.on('data', (d) => { out += d })
  child.on('close', (code) => {
    pipRunning.delete(name)
    pipStatus[name] = { state: code === 0 ? 'synced' : 'error', log: out.trim() || `exit ${code}, no output` }
  })
  child.on('error', (err) => {
    pipRunning.delete(name)
    pipStatus[name] = { state: 'error', log: String(err) }
  })
}

/** Where a cut's lines file lives, source of the beat/line -> start lookup
 *  both halves of `recordClipApply` need. */
const linesPath = (name) => path.join(VIDEO_DIR, 'cues', `${name}-lines.json`)

/**
 * Turn one clip apply into a notes-file update. Pure, so it can be unit-tested
 * without the dev server; the `/__clip` POST handler does the file I/O around
 * it and must never let a problem here fail the apply that already succeeded.
 *
 * `notes` is the file's current list. `oldLines`/`newLines` are the `lines`
 * arrays from `<name>-lines.json` before and after this apply's `rebuild` -
 * every line after the edited one may have moved. `id` is the edited line's
 * "beat.line" id, `entry` is that id's placement entry as it now stands
 * (`trim`, `gap`, `cuts`), and `now` is the ISO timestamp to stamp the new
 * note with.
 *
 * Two things happen:
 *  - every existing note with a beat/line that resolves in both lines files
 *    is shifted by how far that line's start moved (notes with no beat/line,
 *    or whose line vanished, are left alone);
 *  - the edit itself is recorded as a `clip <id>: ...` note at the edited
 *    line's new start, replacing any earlier note for the same id rather than
 *    piling up one per apply.
 */
function recordClipApply(notes, oldLines, newLines, id, entry, now) {
  const [beatStr, lineStr] = id.split('.')
  const beat = Number(beatStr)
  const line = Number(lineStr)
  const findLine = (lines, b, l) => lines.find((x) => x.beat === b && x.line === l) ?? null
  const newLine = findLine(newLines, beat, line)
  if (!newLine) throw new Error(`recordClipApply: line ${id} not found in the rebuilt lines`)
  const prefix = `clip ${id}:`

  const shifted = notes
    .filter((n) => !(typeof n.text === 'string' && n.text.startsWith(prefix))) // replaced below
    .map((n) => {
      if (n.beat === null || n.line === null) return n
      const oldLine = findLine(oldLines, n.beat, n.line)
      const matchedNew = findLine(newLines, n.beat, n.line)
      if (!oldLine || !matchedNew) return n
      return { ...n, t: +(n.t + (matchedNew.start - oldLine.start)).toFixed(3) }
    })

  // Only the fields the placement entry actually carries, in the order a
  // reader would want to check them: where it now starts and ends, the gap
  // before it, and any internal cuts.
  const parts = [prefix]
  if (entry.trim?.start !== undefined) parts.push(`in ${entry.trim.start.toFixed(3)}`)
  if (entry.trim?.end !== undefined) parts.push(`out ${entry.trim.end.toFixed(3)}`)
  if (entry.gap !== undefined) parts.push(`gap ${entry.gap.toFixed(3)}`)
  if (entry.cuts?.length) {
    parts.push(`cuts [${entry.cuts.map(([a, b]) => `[${a.toFixed(2)},${b.toFixed(2)}]`).join(',')}]`)
  }

  const note = { t: newLine.start, beat, line, text: parts.join(' '), created: now }
  return [...shifted, note].sort((a, b) => a.t - b.t)
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
 * into the placement and runs join, retime and the copy into public/scripts,
 * then starts a pip re-cut in the background (see `rebuildPip`) so the camera
 * clip and its manifest stop drifting from the placement that now runs.
 *
 * `GET /__clip/<name>/status` reports that background job: `{ state, log }`,
 * `state` one of `idle` (nothing has kicked off a re-cut this server run),
 * `updating`, `synced` or `error`.
 */
const clipEditor = {
  name: 'color-taylor-clip-editor',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const statusMatch = /^\/__clip\/([\w-]+)\/status\/?(?:\?.*)?$/.exec(req.url || '')
      if (statusMatch) {
        if (req.method !== 'GET') {
          res.setHeader('allow', 'GET')
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          return res.end(JSON.stringify({ error: 'GET only' }))
        }
        const name = statusMatch[1]
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        return res.end(JSON.stringify(pipStatus[name] ?? { state: 'idle', log: '' }))
      }

      const m = /^\/__clip\/([\w-]+)\/(\d+\.\d+)(\/audio)?\/?(?:\?.*)?$/.exec(req.url || '')
      if (!m) return next()
      const [, name, id, audio] = m
      const send = (status, body) => {
        res.statusCode = status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(body))
      }
      if (!NOTES_DIR) return send(404, { error: 'PRESENTATION_NOTES_DIR is not set' })
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
              // Before the rebuild moves everything after this line, so the note
              // re-anchoring below has something to measure the shift against.
              const oldLines = fs.existsSync(linesPath(name)) ? (readJson(linesPath(name)).lines ?? []) : []
              rebuilding = true
              let result
              try {
                result = rebuild(name)
                // The line timing is already live at this point; the camera clip catching up is
                // not something the editor's Apply needs to wait on.
                if (result.ok) rebuildPip(name)
              } finally {
                rebuilding = false
              }
              if (result.ok) {
                // Record the edit as a note and re-anchor the rest, but never let a
                // problem here fail an apply that already succeeded on disk.
                try {
                  const newLines = readJson(linesPath(name)).lines ?? []
                  const notesFile = path.join(NOTES_DIR, `${name}-notes.json`)
                  const notesDoc = fs.existsSync(notesFile) ? readJson(notesFile) : { source: name, notes: [] }
                  const notes = Array.isArray(notesDoc.notes) ? notesDoc.notes : []
                  const updated = recordClipApply(notes, oldLines, newLines, id, entry, new Date().toISOString())
                  fs.mkdirSync(NOTES_DIR, { recursive: true })
                  fs.writeFileSync(notesFile, JSON.stringify({ source: name, notes: updated }, null, 2) + '\n')
                } catch (err) {
                  console.error(`[clip editor] could not record the note for ${id}:`, err)
                }
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
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  plugins: [react(), tailwindcss(), siteUrlHtml, presentationNotes, presentationFrames, clipEditor],
  server: {
    // The cut's assets are rebuilt and copied over while the server runs, and
    // chokidar's unlink path kills it with ERR_CLOSED_SERVER when one of them
    // is replaced or deleted. They are fetched rather than imported, so there
    // is no module graph to invalidate and nothing to gain from watching them.
    watch: { ignored: ['**/public/scripts/**'] },
  },
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
