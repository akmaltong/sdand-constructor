import { type FloorplanMoveTarget, type StairNode } from '@pascal-app/core';
/**
 * 2D floor-plan move handler for stair.
 *
 * Existing stairs preserve the cursor grab offset, matching the 3D move
 * tools; fresh catalog placement follows the cursor absolutely.
 *
 * Figma alignment is layered on the stair footprint edges; Alt bypasses.
 * Guides are cleared by `FloorplanRegistryMoveOverlay`'s Path 1 teardown.
 *
 * The position is written straight to scene each tick (the stair has a real
 * `position` field, unlike polygon kinds) and re-applied atomically via
 * `commit()` so the overlay's deterministic revert → resume → commit path
 * records a single undo step (same pattern door / window use).
 */
export declare const stairFloorplanMoveTarget: FloorplanMoveTarget<StairNode>;
//# sourceMappingURL=floorplan-move.d.ts.map