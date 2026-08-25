---
tags:
  - domain/presentation
  - domain/audio
  - status/draft
  - origin/user-call
---

# Plan: Narrating The Intro Deck

**2026-08-25.** Record Taylor giving the intro, play it alongside the deck, and
have the same material serve two outputs: a YouTube video, and a narrated
walkthrough people can run in the app. Draft — nothing here is built.

The script this narrates is [[plan-teaching-rgb-to-hsb]], which already has the
ladder, the proposed slide rewrites and a video running order. **Do not write a
new script.** That note is the source; this one is about getting it recorded and
played back.

## The constraint that decides the shape

**A browser will not play audio until the user has interacted with the page.**
Arriving at `/intro` from a link is a navigation, not a gesture, so the first
clip is blocked — silently, with a rejected promise and no error anyone sees.

So the deck needs an explicit start affordance on slide one. Not a preference
buried in settings: a visible control that doubles as the thing that unlocks
playback for the rest of the session. Everything else here is negotiable; this
is not, and it is the single easiest thing to discover three days late.

## One clip per slide, keyed by slide id

Not one continuous track with cue offsets.

- **Navigation is non-linear.** Arrows, keyboard and the dot row all jump. A
  single track needs a seek for every jump and is wrong the moment a seek is
  off; per-slide clips are correct at every entry point by construction.
- **The script is still moving.** [[plan-teaching-rgb-to-hsb]] proposes rewrites
  to five slides and one new one. Per-slide clips mean re-recording one slide
  costs one slide.
- **Slide ids are already stable and already gapped** — `00-intro`, `00b-acronyms`,
  `01-1bit` … `15-app`, with no `05`, `11` or `14`. They are identifiers, not
  indices, so audio keyed by id survives reordering and insertion. Key by id;
  never by position.

The cost is that delivery breaks at every slide boundary. Mitigate by recording
in one sitting rather than over weeks, so tone and level match.

## Playback

Two modes, and the distinction matters.

**Narrated** (default once started): entering a slide plays its clip, leaving
stops it. Advancing stays manual. Someone who wants to sit on the hexagon slide
and drag things can.

**Autoplay**: the clip ending advances the slide. This is the mode you
screen-record, and it should be explicit rather than the default — a deck that
moves under you while you are reading is hostile.

Deliberately **not** in v1: cue points *inside* a clip driving animation beats.
The deck's own keyframes already run on their own timing. Syncing narration to
sub-slide reveals is the thing most likely to force a redesign, so find out
whether it is needed by recording against the deck as it stands.

## Assets

Rough sizing: 15 slides, ~30-60s each, mono speech at 64-96 kbps is ~250-450 KB
a slide, so **4-6 MB total**. That is fine to host on Pages and unthinkable to
put in the picker bundle.

- `public/intro/audio/<slide-id>.<ext>` — static files, alongside the `/intro`
  front door. Not imported, so nothing reaches the bundle graph.
- Load the current slide's clip on entry and prefetch the next one. Nothing else.
- Follow [[decision-audio-as-optional-module]]: narration is a module the
  presentation loads, not something the picker links against. The Figma plugin
  must not see it at all — it never renders `PresentationShell`, but check the
  bundle rather than assume.
- Format: pick one that needs no fallback chain. AAC/M4A is the safe universal
  choice; Opus is smaller but its container support has historically been the
  thing that breaks on one browser.

## A script is fine. Typing it is the friction.

The constraint is narrower than "do not write a script", which is where the
first draft of this note landed and it was wrong. Working from a script is fine.
Producing one by typing is the part that drags, against a delivery style that is
conversational and better for being so.

So the script gets **drafted for** Taylor rather than by him. The raw material
already exists - [[plan-teaching-rgb-to-hsb]] has the ladder, the six rungs and
the proposed slide rewrites - and turning that into per-slide talking copy is
work that does not need the person who is going to say it out loud.

Two orders both work. Pick per slide if it helps:

**Drafted first.** Script goes to Taylor, he delivers it in his own words rather
than reading it flat.

**Spoken first.** Rough pass against the deck, transcribe it, tidy the
transcript into the script, re-record from that. Good for the slides where the
right framing is not obvious yet - talking is how it gets found.

## Captions come from the take, not from the script

Whichever order produced the script. A conversational delivery drifts from any
written line, and captions that disagree with the audio are worse than no
captions - they read as a transcript of a different recording.

So the last step is always: transcribe the final audio, tidy lightly for
punctuation, ship as WebVTT. Transcription is the cheap step now; this is not
the place to save it.

Captions are not optional. Narration with no transcript is a step backwards for
anyone who cannot hear it, and this is a teaching tool.

## Record continuously, split afterwards

This resolves the obvious tension with per-slide clips. Improvising wants one
continuous take; non-linear navigation wants per-slide files.

Do both: talk through the whole deck in one pass, advancing as you go, then cut
the recording at the slide boundaries. Flow and level stay consistent because it
*was* one take, and the output is still one file per slide id. Retakes stay
cheap - re-record a slide, cut it in, and nothing else moves.

This holds whether the pass is improvised or delivered from a draft. The point
is the pass, not the preparation.

## The video cut

Screen-record autoplay rather than rendering offline. It captures the real app —
the keyframe animations, the picker handoff on `15-app` — and there is no second
implementation to keep in step.

Check the stage's aspect before recording; the deck panel is 726x320, very wide
and short, and a 16:9 capture will letterbox it unless the surrounding layout
fills the frame.

## The fork changes this

[[plan-intro-two-paths]] adds a choice after the opening - the history path or
straight to the colour models. Narration has to know which path it is on: the
fork slide needs its own clip, and the rejoin at `06-spectrum` must not
reference history the short path never heard. Worth settling the fork before
recording, since a rejoin line is the kind of thing that is invisible until
someone takes the other road.

## Open questions

- Does any slide actually need sub-slide sync, or does per-slide land? Recording
  one difficult slide answers this cheaply. `12-hexagon` is the candidate.
- Narrated by default when someone arrives at `/intro`, or opt-in? Leaning
  default-on-after-the-gesture, because a silent narrated deck is confusing.
- Does the last slide's handoff into the picker need its own outro, or does the
  narration simply stop?

## Related

- [[plan-teaching-rgb-to-hsb]] — the script, the ladder, the video running order
- [[decision-audio-as-optional-module]] — the pattern narration has to follow
- [[decision-audio-off-by-default]] — why nothing here should make noise unasked
