/**
 * The one place the shipping cut is named: the app's own walkthrough entry and
 * the camera panel both read this, so a new cut is one edit here.
 *
 * Only this cut's assets ship. Everything under `public/scripts/` for an older
 * cut is removed before a deploy - see HANDOFF, "Shipping the walkthrough in
 * the app".
 */
export const CURRENT_CUT = 'cut-05';
