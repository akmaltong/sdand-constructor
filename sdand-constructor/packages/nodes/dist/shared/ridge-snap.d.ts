import type { RoofSegmentNode } from '@pascal-app/core';
/**
 * Shared ridge-line snap math for ridge-vent placement + move tools.
 *
 * Ridge vents must sit centered on the segment's ridge — off-ridge the
 * cap's far half dips into the higher part of the slope ("goes inside"
 * the roof). So the placement tools clamp the cursor onto the ridge:
 * closest-point projection along the segment's local X axis, with the X
 * span clipped to where a real ridge actually exists for that roof type.
 *
 * Per roof type (the segment's ridge runs along the segment's local X):
 *   - gable / gambrel / dutch / mansard: ridge spans the full width.
 *   - hip: ridge is shortened by the hipped ends — spans width − depth.
 *     A square hip (width ≤ depth) collapses to a single apex point.
 *   - shed: no true ridge — snap to the high eave (z = -depth/2).
 *   - flat: no ridge at all → return null.
 */
export declare const RIDGE_LIFT = 0.12;
export type RidgeSnap = {
    /** Segment-local X of the snapped ridge position. */
    localX: number;
    /** Segment-local Z of the snapped ridge position (0 for peaked roofs). */
    localZ: number;
};
export declare function resolveRidgeSnap(segment: RoofSegmentNode, cursorLocalX: number, _cursorLocalZ: number): RidgeSnap | null;
//# sourceMappingURL=ridge-snap.d.ts.map