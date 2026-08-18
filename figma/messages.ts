/**
 * The bridge protocol between the plugin UI iframe and the sandbox.
 *
 * This is the one seam where the two halves can drift - code.js reads these
 * shapes and main.tsx / swatch-store.ts construct them, in different languages,
 * with no bundler step joining them. Both sides reference these types (main.tsx
 * imports them, code.js uses them through JSDoc), so a renamed or retyped field
 * fails typecheck instead of failing silently at runtime.
 *
 * Types only. Nothing here emits any JavaScript.
 */

/** Which paint the picker reads and writes. 'none' reads but never writes. */
export type PaintTarget = 'fill' | 'stroke' | 'none';

// ---------------------------------------------------------------- UI → sandbox

/** First message on mount: seed me with the selection and the stored swatches. */
export interface ReadyMessage {
  type: 'ready';
}

/** One animation frame's worth of "has the selection's paint changed?". */
export interface PollMessage {
  type: 'poll';
}

export interface ApplyMessage {
  type: 'apply';
  hex: string;
  /** 0..1, Figma's paint opacity - not the UI's 0..100 alpha. */
  opacity: number;
  /**
   * Advisory only. The sandbox keeps its own target, set by TargetMessage,
   * and ignores this field - it rides along so the message is self-describing
   * in the console.
   */
  target: PaintTarget;
}

/** Fill/Stroke/None switch. The sandbox re-seeds rather than painting. */
export interface TargetMessage {
  type: 'target';
  target: PaintTarget;
}

/** Close the undo group - one entry per gesture, not per drag frame. */
export interface CommitMessage {
  type: 'commit';
}

/** The UI reporting its content height. The only thing that sets height. */
export interface AutosizeMessage {
  type: 'autosize';
  height: number;
}

/** An edge drag. Width only - height stays whatever the content needs. */
export interface ResizeWidthMessage {
  type: 'resizeWidth';
  width: number;
  fromLeft: boolean;
}

export interface ResizeEndMessage {
  type: 'resizeEnd';
}

/** A swatch list changed; persist it under `key` in clientStorage. */
export interface SaveSwatchesMessage {
  type: 'saveSwatches';
  key: string;
  value: unknown;
}

/** Supported by the sandbox; no UI control currently sends it. */
export interface CloseMessage {
  type: 'close';
}

export type UiToSandboxMessage =
  | ReadyMessage
  | PollMessage
  | ApplyMessage
  | TargetMessage
  | CommitMessage
  | AutosizeMessage
  | ResizeWidthMessage
  | ResizeEndMessage
  | SaveSwatchesMessage
  | CloseMessage;

// ---------------------------------------------------------------- sandbox → UI

/**
 * The selection changed, or its paint did. `hex: null` with a non-zero count
 * is the echo-suppression case: our own paint came back round, so the count
 * still updates but the color half is withheld so it cannot fight a drag.
 */
export interface SelectionMessage {
  type: 'selection';
  count: number;
  hex: string | null;
  /** 0..1, meaningful only when hex is present. */
  opacity: number;
}

/** An edit is in flight - start the frame-clocked poll. */
export interface WakeMessage {
  type: 'wake';
}

/** The stored swatch blob, sent once in reply to ReadyMessage. */
export interface SwatchesMessage {
  type: 'swatches';
  data: Record<string, unknown>;
}

export type SandboxToUiMessage = SelectionMessage | WakeMessage | SwatchesMessage;
