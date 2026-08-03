# Wiki Conventions

This `wiki/` folder is an Obsidian vault — a human-readable knowledge graph of project state, decisions, research, and daily logs. It is *separate* from:

- Claude built-in project memory at `~/.claude/projects/<mapped>/memory/` — atomic feedback rules + identity, auto-injected by the harness
- `~/.claude/memory/` — global cross-project tool gotchas, injected once per session by the SessionStart hook
- `docs/` — formal specs and public-facing artifacts
- `CLAUDE.md` (repo root) — instructions for working in the codebase

If you (Claude) are unsure where something belongs, prefer `wiki/` for: project state, decisions and rationale, lessons learned, half-formed thoughts, links between concepts, daily progress. Cross-cutting feedback rules go to built-in memory. Cross-project tool gotchas go to global memory. Formal artifacts go to `docs/`.

## Folder layout

| Folder | Contents | Filename pattern |
|---|---|---|
| `wiki/` (root) | `index.md` only | `index.md` |
| `wiki/daily/` | One file per working day | `YYYY-MM-DD.md` |
| `wiki/notes/` | Evergreen atomic notes, one concept each | `kebab-case-title.md` |
| `wiki/research/` | External references, each summarized with a source link | `kebab-case-slug.md` |
| `wiki/test-plans/` | Session test plans the user works through | `test-plan-YYYY-MM-DD-topic.md` |
| `wiki/mocs/` | Maps of Content — index notes linking clusters | `area.md` |

## Naming

- Filenames: lowercase, kebab-case, `.md`.
- Note titles: H1 in Title Case.
- Daily notes: `YYYY-MM-DD.md`, no H1 needed.
- Decisions: `notes/decision-*.md`. Plans: `notes/plan-*.md`.

## Linking

Obsidian wikilinks, no extension: `[[decision-single-source-picker]]`. Link eagerly — if a concept comes up twice, make it a note and link both. Backlinks are automatic; don't maintain them by hand.

## Tags

YAML frontmatter, namespaced. Tags encode axes folders don't capture.

```yaml
---
tags:
  - domain/figma-plugin
  - status/adopted
---
```

| Axis | Prefix | Values | Cardinality |
|---|---|---|---|
| Domain | `domain/` | `figma-plugin`, `color-math`, `bundle`, `a11y`, `presentation`, `audio`, `storage`, `ui` | 1+ |
| Status | `status/` | `adopted`, `superseded`, `deferred`, `open`, `verified`, `draft` | exactly 1 |
| Origin | `origin/` | `user-call`, `platform-limit`, `external-research`, `bug` | 0+ |

Promote a tag only when 3+ notes would use it; one-offs become wikilinks. MOCs, daily notes, and `index.md` are not tagged — the folder already classifies them.

## Decisions

`notes/decision-*.md`, each covering: what was decided, why, what was rejected, and the date. Linked from [[decisions]]. When a decision is reversed, set `status/superseded` and link forward to the note that replaced it rather than deleting.

## Daily notes

Free-form. What happened, what was decided, what's open. When something in a daily is worth keeping, lift it into `notes/` and link back.

Dailies before 2026-08-03 were reconstructed from git history and are marked as such — they record what the commits show, not what was discussed.

## When to write here

- A decision gets made → `notes/decision-*.md`
- Something notable happens during work → append to today's daily
- External research shapes a choice → `research/*.md` with the source link
- The user says "write this down" and it isn't a preference or convention

## Edits and links

Creating a note also means: add a wikilink from the relevant MOC, create the MOC if it doesn't exist and link it from `index.md`, and add a one-line reference in today's daily.
