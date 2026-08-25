---
tags:
  - domain/presentation
  - status/draft
  - origin/user-call
---

# Plan: Two Paths Through The Intro

**2026-08-25.** A fork at the opening — the long way through the Macintosh
colour history, or straight to how RGB and HSB actually work — and a period frame
for the history path that evolves as the machines do. Draft; nothing built.

Sits with [[plan-teaching-rgb-to-hsb]] (the argument) and [[plan-narrated-intro]]
(the narration). Issues #79 and #80.

## Why fork at all

The history is the best part of the deck and the wrong thing to force on
everybody. Someone who came to learn HSB and gets four slides of System 5 will
leave; someone who came for the story and gets dropped into channel arithmetic
loses the reason to care. The current deck picks one order and hopes.

The two audiences also arrive differently. A video viewer takes the long way by
default, because the history is what keeps people watching once they already
care. Someone who followed a link from the picker wants the short way.

## The shape

The slides already split cleanly along the seam:

| | slides |
|---|---|
| Opening | `00-intro`, `00b-acronyms` |
| **History path** | `01-1bit`, `02-sixteen`, `03-256`, `04-channels` |
| Core (both paths) | `06-spectrum` … `13-equations` |
| Outro | `15-app` |

So the fork is a choice made after the opening, and the two paths rejoin at
`06-spectrum`. The history slides are exactly the four carrying `titleMeta`,
which is not a coincidence - they are the ones about machines rather than about
colour.

## Route by slide id, not by index

This is the enabling change, and it pays for itself twice.

`#/intro/7` is an index into one linear array. A fork breaks that: position 7
means different slides on different paths, so a shared link lands somewhere
arbitrary. Keying the route to the slide id instead - `#/intro/12-hexagon` -
survives forking, reordering and insertion, which is what ids are for. They are
already stable and already gapped (no `05`, `11`, `14`), which is the tell that
they were never meant to be positions.

It also **fixes the deep-link bug on the way past**: `PresentationShell` writes
the slide to the hash but never reads it, so `#/intro/7` opens on slide 1 today.
Reading an id on mount is the same work as reading an index, and correct.

The progress readout has to come from the active path, not the array - "3 / 9"
on the short way and "3 / 15" on the long one. A counter that says 15 while
showing nine is worse than no counter.

## The period frame

For the history path only: give the panel the proportions of a compact
Macintosh screen and imply the rest of the machine in vector strokes around it,
then let that frame change as the slides move through the years.

The four history slides already carry `titleMeta: { bits, colorCount, year, os }`,
so the frame keys off data that exists. No new model - a `frame` derived from
`year` is enough.

**The catch, and it is a real one.** `panelConstants.ts` sets `PANEL_W = 726`
because it *matches the picker's hexagon panel width*, and that is what lets
`15-app` scale the real app down into the panel's footprint and grow it out. So
the panel's proportions are load-bearing at the end of the deck. A compact Mac
screen is about 3:2 against the panel's current 2.27:1 - much squarer - and
changing `PANEL_W`/`PANEL_H` globally would break the handoff.

Which means the frame is a **treatment applied over the history slides**, not a
change to the shared panel. Either an inner region letterboxed inside the
existing panel, or a per-section override with the frame animating open as the
paths rejoin - the machine giving way to the tool. The second is better
storytelling and more work.

Worth noting the frame would also help [[plan-teaching-rgb-to-hsb]]'s cube
reveal, which that note says "wants vertical room" the 726x320 panel does not
have. If a taller region is being built for the history anyway, the cube may be
able to borrow it.

## Open questions

- Does the short path still want *a* frame, or does it start in the app's own
  proportions and never mention the machines? Leaning the latter - the frame is
  the history's costume, not the deck's.
- Where does the fork live visually? A slide with two doors is honest but adds a
  click for everyone. A quieter option is a "skip the history" affordance on the
  first history slide, which costs the impatient one slide rather than everyone
  one decision.
- The four `titleMeta` year/OS claims are the deck's existing assertions. Putting
  recognisable hardware on screen beside them raises the cost of getting one
  wrong, so they are worth checking before the frame ships, not after.
- Stylised outlines of period hardware are ordinary historical illustration, but
  it is a call worth making deliberately rather than discovering later.

## Related

- [[plan-teaching-rgb-to-hsb]] — the argument the core path makes
- [[plan-narrated-intro]] — the narration, which has to know which path it is on
- [[presentation]] — the MOC
