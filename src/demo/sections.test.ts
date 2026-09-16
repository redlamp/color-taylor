import { describe, test, expect } from 'bun:test';
import { layoutSectionLabels, LABEL_ANGLE_DEG, type SectionMark } from './sections';

/** Same fallback `measure()` falls back to outside a DOM canvas (bun's test
 *  runner has no `document`), so expectations below are computed from it
 *  rather than real font metrics. */
const CHAR_W = 7.2;
const LINE_HEIGHT = 16;
const ANGLE_RAD = (LABEL_ANGLE_DEG * Math.PI) / 180;
const MIN_GAP = 6;

function extentOf(label: string): number {
  return label.length * CHAR_W * Math.cos(ANGLE_RAD) + LINE_HEIGHT * Math.sin(ANGLE_RAD);
}

function mark(id: number, label: string, t: number): SectionMark {
  return { id, label, t };
}

describe('layoutSectionLabels', () => {
  test('marks with no overlap are left at their anchor', () => {
    const marks = [mark(1, 'A', 0), mark(2, 'B', 50)];
    const out = layoutSectionLabels(marks, 100, 1000);
    expect(out[0].leftPx).toBeCloseTo(0, 5);
    expect(out[1].leftPx).toBeCloseTo(500, 5);
    expect(out[0].anchorPx).toBeCloseTo(out[0].leftPx, 5);
    expect(out[1].anchorPx).toBeCloseTo(out[1].leftPx, 5);
  });

  test('two overlapping labels are pushed apart symmetrically', () => {
    // Anchors 1px apart, duration and width equal so t maps 1:1 to px:
    // "Figma" and "Outro" (5 chars each) fully overlap at that spacing.
    const marks = [mark(1, 'Figma', 100), mark(2, 'Outro', 101)];
    const out = layoutSectionLabels(marks, 1000, 1000);
    const extent = extentOf('Figma');
    const overlap = 100 + extent + MIN_GAP - 101;
    expect(out[0].leftPx).toBeCloseTo(100 - overlap / 2, 5);
    expect(out[1].leftPx).toBeCloseTo(101 + overlap / 2, 5);
    // Figma (left) moves left, Outro (right) moves right, per Taylor's call.
    expect(out[0].leftPx).toBeLessThan(out[0].anchorPx);
    expect(out[1].leftPx).toBeGreaterThan(out[1].anchorPx);
  });

  test('a chain of three overlapping labels resolves with no pair left overlapping', () => {
    const marks = [mark(1, 'Intro', 200), mark(2, 'Figma', 201), mark(3, 'Outro', 202)];
    const out = layoutSectionLabels(marks, 1000, 1000);
    expect(out).toHaveLength(3);
    // Order along the row is preserved.
    expect(out[0].leftPx).toBeLessThan(out[1].leftPx);
    expect(out[1].leftPx).toBeLessThan(out[2].leftPx);
    // Every adjacent pair clears the minimum gap.
    for (let i = 0; i < out.length - 1; i++) {
      const extent = extentOf(out[i].text);
      expect(out[i].leftPx + extent + MIN_GAP).toBeLessThanOrEqual(out[i + 1].leftPx + 1e-3);
    }
    // The chain pushes outward from the middle: the first moves left of its
    // anchor, the last moves right of its anchor.
    expect(out[0].leftPx).toBeLessThan(out[0].anchorPx);
    expect(out[2].leftPx).toBeGreaterThan(out[2].anchorPx);
  });

  test('clamps the last label to the right edge of the track', () => {
    const marks = [mark(1, 'A section with a long name', 990)];
    const out = layoutSectionLabels(marks, 1000, 1000);
    const extent = extentOf(marks[0].label);
    expect(out[0].leftPx + extent).toBeCloseTo(1000, 5);
    expect(out[0].leftPx).toBeLessThan(out[0].anchorPx);
  });

  test('clamps the first label to the left edge and repairs the overlap it reopens', () => {
    const marks = [mark(1, 'Figma', 0), mark(2, 'Outro', 1)];
    const out = layoutSectionLabels(marks, 1000, 1000);
    expect(out[0].leftPx).toBe(0);
    const extent = extentOf('Figma');
    expect(out[1].leftPx).toBeGreaterThanOrEqual(0 + extent + MIN_GAP - 1e-6);
  });

  test('is a pure function: same inputs, same outputs, no mutation of the marks', () => {
    const marks = [mark(1, 'Figma', 0), mark(2, 'Outro', 1)];
    const snapshot = JSON.parse(JSON.stringify(marks));
    const a = layoutSectionLabels(marks, 1000, 1000);
    const b = layoutSectionLabels(marks, 1000, 1000);
    expect(marks).toEqual(snapshot);
    expect(a).toEqual(b);
  });
});
