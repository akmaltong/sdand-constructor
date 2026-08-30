import { type AlignmentAnchor, type WallNode } from '@pascal-app/core';
/** Figma-style alignment-snap threshold (meters), matching the move tools. */
export declare const WALL_OPENING_ALIGNMENT_THRESHOLD_M = 0.08;
/**
 * Resolve a wall opening's along-wall position with Figma-style alignment to
 * other objects, publishing the matching guide as a side effect.
 *
 * The probe is the RAW cursor position on the wall (not the 0.5m snap) so
 * off-grid anchors are caught; we then keep only the guide on an axis the wall
 * runs along and map it to the along-wall coordinate that lands the opening on
 * it. Falls back to the half-metre snap when nothing aligns, and clears the
 * guide on bypass / no-match. Returns the localX to use (X-clamped to the wall
 * given `width`). `bypass` (Alt) disables alignment.
 */
export declare function resolveWallSlideAlignment(args: {
    wallNode: WallNode;
    rawLocalX: number;
    width: number;
    candidates: readonly AlignmentAnchor[];
    bypass: boolean;
}): number;
//# sourceMappingURL=wall-opening-alignment.d.ts.map