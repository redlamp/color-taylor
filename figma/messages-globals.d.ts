/**
 * Re-exports the bridge protocol as bare global type names for code.js.
 *
 * code.js cannot reference module types the normal JSDoc way - a type of the
 * form `import('./messages').X` trips Figma's plugin loader, which scans the
 * raw source for dynamic-import syntax and rejects the file even when the
 * expression only ever appears inside a comment ("possible import expression
 * rejected around line 1"). This file is only seen by the typechecker, never
 * by Figma, so the module import lives here and code.js uses the plain names.
 *
 * Keep code.js free of the substring `import` entirely - the scanner's
 * "possible" suggests it errs on the side of rejecting.
 */
import type {
  PaintTarget as ProtocolPaintTarget,
  SandboxToUiMessage as ProtocolSandboxToUiMessage,
  UiToSandboxMessage as ProtocolUiToSandboxMessage,
} from './messages';

declare global {
  type PaintTarget = ProtocolPaintTarget;
  type SandboxToUiMessage = ProtocolSandboxToUiMessage;
  type UiToSandboxMessage = ProtocolUiToSandboxMessage;
}
