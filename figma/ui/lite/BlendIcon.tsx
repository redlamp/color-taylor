/**
 * Figma's own blend glyph, from figma-plugin-ds: a droplet, outline when off
 * and half-filled when on.
 *
 * Their artwork rather than a Lucide approximation, because this control sits
 * beside Figma's chrome and their vocabulary for "blend" is this exact shape -
 * not the overlapping circles most icon sets reach for. Two paths on a 32x32
 * artboard with the glyph occupying roughly x 12-20, y 11-21, so the viewBox is
 * cropped to the artwork or it renders as a speck at 14px.
 */
const FILLED =
  'M16.002 11.002l.693.718C18.898 14.012 20 15.294 20 16.852a4.199 4.199 0 01-1.172 2.936 3.906 3.906 0 01-5.656 0A4.199 4.199 0 0112 16.852c0-1.558 1.102-2.84 3.305-5.132l.694-.719zm-2.197 3.91c.502-.681 1.219-1.455 2.195-2.472.976 1.017 1.693 1.79 2.195 2.471.6.814.805 1.38.805 1.94v.003c0 .049 0 .098-.003.146h-5.994a3.37 3.37 0 01-.003-.146v-.002c0-.56.205-1.127.805-1.94z';

const EMPTY =
  'M16.695 11.72l-.693-.718L16 11l-.001.002-.694.718C13.102 14.012 12 15.294 12 16.852a4.199 4.199 0 001.172 2.936 3.906 3.906 0 005.656 0A4.199 4.199 0 0020 16.852c0-1.558-1.102-2.84-3.305-5.132zm-.695.72c-.977 1.017-1.693 1.79-2.195 2.471-.6.814-.805 1.38-.805 1.94v.003a3.2 3.2 0 00.89 2.239 2.906 2.906 0 004.22 0 3.2 3.2 0 00.89-2.239v-.002c0-.56-.205-1.127-.805-1.94-.502-.681-1.219-1.455-2.195-2.472z';

export default function BlendIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="11 10 10 11"
      width={13}
      height={13}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path fillRule="evenodd" clipRule="evenodd" d={filled ? FILLED : EMPTY} />
    </svg>
  );
}
