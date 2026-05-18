let enabled = true;
let lastTap = 0;

export function setHapticsEnabled(on: boolean) {
  enabled = on;
}

/**
 * Fire a haptic tap if vibration API is available and haptics are enabled.
 * @param ms duration of the pulse (most devices clamp to a min ~5ms)
 * @param minIntervalMs if set, suppress this tap when fewer ms have passed since the last
 */
export function hapticTap(ms: number, minIntervalMs = 0) {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  if (minIntervalMs > 0) {
    const now = performance.now();
    if (now - lastTap < minIntervalMs) return;
    lastTap = now;
  } else {
    lastTap = performance.now();
  }
  navigator.vibrate(ms);
}
