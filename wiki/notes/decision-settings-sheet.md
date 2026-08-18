---
tags:
  - domain/ui
  - domain/a11y
  - status/adopted
  - origin/user-call
---

# Decision: Settings Is a Right-Edge Sheet, Not a Floating Window

**2026-08-18.** The Settings panel was a hand-rolled `position: fixed` `<aside>`
that opened at `top-20 right-4`, floated over the Color Editor, and could be
dragged anywhere on screen. The user's read - *"the current free-floating
approach doesn't feel quite right"* - prompted a survey of it. It is now a
modal right-edge sheet built on base-ui's `Dialog`.

## What the survey found

Visually, the free-floating window had two problems that compound:

- **It is not attached to anything.** It opens near the gear that summons it
  but not from it, so it reads as a detached window that happened to appear,
  not as that button's panel. Drag it once and even that weak association is
  gone.
- **It covers the thing it configures**, with no scrim on desktop. Two of the
  three Display settings - theme and border colour effects - are judged by
  looking at the app, and the panel sits squarely over the Color Editor.

Technically it had accumulated a list of defects, all of them consequences of
being hand-rolled rather than of any decision anyone made:

| | |
|---|---|
| `aria-hidden={!open}` on a subtree that stayed tabbable | The textbook aria-hidden violation - keyboard users could reach controls inside a panel the same attribute told screen readers was not there |
| No `role="dialog"`, no accessible name | The `<h2>` was decoration, not the panel's name |
| No focus trap, no focus restore | Tab walked straight out of the open panel; closing dropped focus to `<body>` |
| Click-outside on mobile only | On desktop nothing dismissed it but the X or Escape |
| Hide by `translate-x-[110%]` | Broke inside the presentation, where a transformed ancestor makes `fixed` resolve against the wrapper - 181px of a supposedly hidden panel sat on the last slide. The fix had to live in `PresentationStage`, not here |
| Drag position in an inline style guarded by a render-time `window.innerWidth` read | Went stale on resize/rotate |
| Two hide mechanisms (transform vs opacity) chosen by reading a ref during render | Carried its own `eslint-disable` |

Separately, the switch markup existed in **five copies** - one in
`DisplaySettings`, four in `AudioSettings` - and had already drifted. The fix
that stopped the knob vanishing in dark mode (`bg-white` on a pale
`bg-primary` track) only ever landed on the Display copy, so Color Synth,
Compressor, Hold note and Linked kept the bug. The Audio copies also had no
accessible name at all.

## What was decided

**A modal right-edge sheet, on base-ui `Dialog`.** Portal, backdrop, focus
trap, focus restore, Escape and click-outside all come from the primitive, so
every row in the table above is *deleted* rather than fixed - including the
presentation fragility, since portalling to `<body>` removes the transformed
ancestor from the picture rather than working around it.

The sheet shape is the one the panel already used below `md`. Making it the
only shape is what retires the drag: a panel anchored to an edge has nowhere
to be dragged to. That is the intended trade - the drag was the sole
capability lost, and it was also the source of three of the defects.

The backdrop is `bg-black/20` with **no** `backdrop-blur`, unlike the repo's
`DialogOverlay`. This is a colour tool and two of the settings are judged by
looking at the app underneath; the scrim should say "modal" without
recolouring what it sits over.

The five switch copies collapse into `settings/SettingsSwitch.tsx`
(`SettingsSwitch` + `SwitchRow`, with a `sm` size for the inline Linked one).
Verified afterwards by reading computed styles in both themes: all four
track/knob combinations pair a light value against a dark one
(0.95/0.145, 0.205/0.985, 0.922/0.205, 0.34/0.985 in oklch L).

## Rejected

- **Anchored popover.** Fixes the "attached to nothing" complaint most
  directly, and is right for the three switches you see by default - but
  Audio expands into the full synth tree (voicing, oscillator, envelope,
  advanced), and a popover that tall is a worse answer than a sheet.
- **Centred modal.** Heavy for toggles, and it covers the whole app rather
  than a strip of it.
- **Keeping it floating and just fixing the a11y.** Possible, but it keeps
  the drag maths, the two hide mechanisms and the presentation workaround, to
  preserve an affordance nobody asked for.
- **Non-modal (`modal={false}`).** Would let you fiddle with the picker while
  settings are open, but loses the focus trap, which is half the point.

## Known trade-off, not yet addressed

With Audio off, the sheet is three switches and a lot of empty height - most
visible on a phone. Full-height is the drawer convention and the space is
used the moment Audio is on, so it stays for now. If it grates, the answer is
probably a content-height sheet pinned to the bottom-right rather than a
return to floating.

## Follow-up this opens

`PresentationStage.tsx` sets `transform: 'none'` after the intro settles,
purely to stop the old fixed panel resolving against its scaled wrapper. That
workaround should now be unnecessary - the panel is portalled - but removing
it is a separate change with its own verification, so it stays until then.

Related: [[decision-audio-off-by-default]], [[decision-border-color-effects]]
