import type { DormerNode } from '@pascal-app/core';
import * as THREE from 'three';
/**
 * Grid-snap step (metres) applied to the world cursor position while a
 * dormer placement / move ghost is in flight. Shared by both tools so
 * the audible snap and the committed position step stay in lockstep.
 */
export declare const DORMER_PLACEMENT_SNAP_M = 0.05;
/**
 * Rotation step (radians) used by the keyboard rotate shortcuts (R /
 * Shift+R) while a dormer placement / move ghost is in flight. 15° —
 * lets the user reach the 90° cardinals in six taps and the 45°
 * diagonals in three.
 */
export declare const DORMER_PLACEMENT_ROTATION_STEP: number;
/**
 * Lightweight silhouette geometry used by the placement / move-tool
 * ghost preview only. Renders the dormer as an extruded pentagon
 * (rectangle body + triangular gable) dropped by `wallSkirtHeight` below
 * the anchor so the cursor sits at the floor of the dormer the way the
 * committed CSG geometry does.
 *
 * For `roofType === 'flat'` (or `roofHeight === 0`) the gable apex is
 * skipped and the shape collapses to a rectangle. Other roof types use
 * the gable approximation — exact per-type silhouettes are a future
 * improvement.
 *
 * Kept self-contained (no `@pascal-app/viewer` imports) so the geometry
 * test doesn't drag in the CSG / BVH module graph, which fails to load
 * outside of a browser/WebGL context. The viewer has its own
 * `buildDormerFallbackGeometry` that mirrors this shape — used both as
 * the CSG fallback when boolean ops fail and as the live-drag preview
 * in the dormer renderer.
 */
export declare function buildDormerGhostGeometry(node: DormerNode): THREE.BufferGeometry;
/**
 * Inspector helper: which window-shape sub-controls to surface for the
 * current dormer.
 */
export declare function dormerSupportsArch(node: DormerNode): boolean;
export declare function dormerSupportsCornerRadii(node: DormerNode): boolean;
//# sourceMappingURL=geometry.d.ts.map