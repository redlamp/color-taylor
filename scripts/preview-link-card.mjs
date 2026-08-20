/**
 * Checks the link-preview tags in a built dist/, and renders what the card will
 * look like.
 *
 *   bun run build && node scripts/preview-link-card.mjs
 *
 * This is the offline half of testing a share card. It can tell you the tags
 * parse, the URLs are absolute, the image ships and its declared size is
 * honest - everything that is a property of what we emit. It cannot tell you a
 * scraper likes it; only a real scraper does that, and that needs a public URL.
 * See wiki/notes/decision-link-preview-card.md for the ladder.
 *
 * The preview it writes is a mock, drawn from our own tags, not a screenshot of
 * any real client. It is here to answer "does the crop cut the wordmark" and
 * "does the description read well truncated", which are the questions you
 * actually have. It is not evidence that WhatsApp will render anything.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const HTML = join(DIST, 'index.html');

if (!existsSync(HTML)) {
  console.error('No dist/index.html - run `bun run build` first.');
  process.exit(1);
}

const html = readFileSync(HTML, 'utf8');

/** Meta tags are matched attribute-order-agnostically; Vite may rewrite them. */
function meta(key) {
  const re = new RegExp(
    `<meta[^>]*(?:property|name)=["']${key}["'][^>]*>`,
    'i'
  );
  const tag = html.match(re)?.[0];
  return tag?.match(/content=["']([\s\S]*?)["']/i)?.[1] ?? null;
}

const decode = (s) =>
  s == null
    ? null
    : s
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

/** Reads width/height out of a JPEG's first SOF marker. */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0-SOF15, excluding the four that are not frame headers.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);
const warn = (m) => notes.push(m);

// --- the tags ---------------------------------------------------------------
const tags = {
  'og:title': meta('og:title'),
  'og:description': meta('og:description'),
  'og:url': meta('og:url'),
  'og:image': meta('og:image'),
  'og:image:width': meta('og:image:width'),
  'og:image:height': meta('og:image:height'),
  'og:type': meta('og:type'),
  'twitter:card': meta('twitter:card'),
  'twitter:image': meta('twitter:image'),
  description: meta('description'),
};

for (const [k, v] of Object.entries(tags)) {
  if (!v) fail(`${k} is missing`);
}

// The whole reason %SITE_URL% exists. A relative value here is the silent
// failure this script is for.
for (const k of ['og:url', 'og:image', 'twitter:image']) {
  const v = tags[k];
  if (v && !/^https?:\/\//i.test(v)) {
    fail(`${k} is not absolute (${v}) - most scrapers will not resolve it`);
  }
}

if (tags['twitter:card'] !== 'summary_large_image') {
  fail(`twitter:card is "${tags['twitter:card']}" - X will use the small thumbnail`);
}

// --- the image --------------------------------------------------------------
const imageUrl = tags['og:image'];
const file = imageUrl && join(DIST, imageUrl.split('/').pop());

if (!file || !existsSync(file)) {
  fail(`og:image points at ${imageUrl}, which is not in dist/`);
} else {
  const buf = readFileSync(file);
  const size = jpegSize(buf);
  const kb = Math.round(buf.length / 1024);

  if (size) {
    if (String(size.width) !== tags['og:image:width'] ||
        String(size.height) !== tags['og:image:height']) {
      fail(
        `declared ${tags['og:image:width']}x${tags['og:image:height']} but the ` +
        `file is ${size.width}x${size.height} - the card reflows when it loads`
      );
    }
    const ratio = size.width / size.height;
    if (ratio < 1.7 || ratio > 2.1) {
      warn(`aspect is ${ratio.toFixed(2)}:1 - platforms crop toward 1.91:1`);
    }
    if (size.width < 600) warn(`${size.width}px wide - some clients demote it to a thumbnail`);
  }

  // Not official limits, and none of the platforms document a real one.
  // Treated as a smell test: an 80 KB card is safe everywhere, a 2 MB one is
  // where WhatsApp starts quietly declining to show a preview at all.
  if (buf.length > 1_000_000) fail(`${kb} KB - too heavy, expect dropped previews`);
  else if (buf.length > 300_000) warn(`${kb} KB - fine most places, risky on WhatsApp`);

  console.log(
    'image  %s  %dx%d  %d KB',
    imageUrl.split('/').pop(), size?.width, size?.height, kb
  );
}

// --- report -----------------------------------------------------------------
console.log('url    %s', tags['og:url']);
console.log('title  %s', decode(tags['og:title']));
console.log('desc   %s', decode(tags['og:description']));

if (tags.description !== tags['og:description']) {
  warn('meta description and og:description differ - probably unintended');
}

for (const n of notes) console.log('note   %s', n);
for (const p of problems) console.log('FAIL   %s', p);

// --- the mock ---------------------------------------------------------------
// Self-contained: the image goes in as a data URI so the file can be opened
// from anywhere, including straight off the temp dir.
if (file && existsSync(file)) {
  const dataUri =
    'data:image/jpeg;base64,' + readFileSync(file).toString('base64');
  const out = join(tmpdir(), 'color-taylor-link-card.html');

  const title = decode(tags['og:title']) ?? '';
  const desc = decode(tags['og:description']) ?? '';
  const host = tags['og:url'] ? new URL(tags['og:url']).host : '';

  writeFileSync(
    out,
    `<!doctype html><meta charset="utf-8"><title>Link card preview</title>
<style>
  body { margin:0; padding:40px; background:#1b1b1f; color:#e7e7ea;
         font:14px/1.45 -apple-system,Segoe UI,system-ui,sans-serif; }
  h1 { font-size:15px; font-weight:600; margin:0 0 4px; }
  p.lede { margin:0 0 32px; color:#9a9aa4; max-width:60ch; }
  .row { display:flex; flex-wrap:wrap; gap:28px; align-items:flex-start; }
  .frame h2 { font-size:11px; text-transform:uppercase; letter-spacing:.08em;
              color:#7c7c86; margin:0 0 8px; font-weight:600; }
  .card { width:340px; border-radius:10px; overflow:hidden; background:#26262b; }
  .card img { display:block; width:100%; }
  .card .body { padding:10px 12px 12px; }
  .card .host { font-size:11px; color:#8d8d97; text-transform:lowercase; }
  .card .t { font-weight:600; margin:2px 0 3px; }
  .card .d { color:#b3b3bd; font-size:13px;
             display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
             overflow:hidden; }
  /* Discord shows the full image and does not crop. */
  .discord { border-left:4px solid #111; background:#2b2d31; }
  /* X and Bluesky letterbox toward 1.91:1. */
  .crop { aspect-ratio:1.91/1; overflow:hidden; display:flex; align-items:center; }
  .crop img { height:100%; width:100%; object-fit:cover; }
  /* WhatsApp truncates hard and shows one description line. */
  .whatsapp .d { -webkit-line-clamp:1; }
  .whatsapp { width:300px; }
</style>
<h1>Link card preview — mock, not a real client</h1>
<p class="lede">Drawn from the tags in <code>dist/index.html</code>. Use it to
check the crop and the truncation. Only a real scraper proves a real platform
will render it.</p>
<div class="row">
  <div class="frame"><h2>Discord / Slack — full aspect</h2>
    <div class="card discord"><img src="${dataUri}">
    <div class="body"><div class="host">${host}</div>
    <div class="t">${title}</div><div class="d">${desc}</div></div></div></div>

  <div class="frame"><h2>X / Bluesky — cropped to 1.91:1</h2>
    <div class="card"><div class="crop"><img src="${dataUri}"></div>
    <div class="body"><div class="host">${host}</div>
    <div class="t">${title}</div><div class="d">${desc}</div></div></div></div>

  <div class="frame"><h2>WhatsApp / Messenger — narrow, one line</h2>
    <div class="card whatsapp"><div class="crop"><img src="${dataUri}"></div>
    <div class="body"><div class="t">${title}</div>
    <div class="d">${desc}</div><div class="host">${host}</div></div></div></div>
</div>
`,
    'utf8'
  );
  console.log('\npreview %s', out);
}

process.exit(problems.length ? 1 : 0);
