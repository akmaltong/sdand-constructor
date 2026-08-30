import { type FloorplanMoveTarget, type ShelfNode } from '@pascal-app/core';
/**
 * 2D floor-plan move handler for shelf — mirrors `itemFloorplanMoveTarget`,
 * because shelf is a `position`-field kind (it carries its location in
 * `node.position`, not in polygon vertices):
 *
 *   - Each pointermove writes the absolute world-plan position straight
 *     to `useScene` (history is paused by the overlay). This is the single
 *     source of truth: the 2D `FloorplanRegistryLayer` and the 3D
 *     `ParametricNodeRenderer` group transform both follow it reactively,
 *     so 2D and 3D can never diverge.
 *   - On commit, the overlay's snapshot-diff reverts to baseline, resumes
 *     history, and re-applies the final position as one undoable step.
 *     `canCommit` only validates.
 *
 * Earlier this used the `useLiveTransforms` + imperative-mesh pattern that
 * `slab` / `ceiling` use. That works for polygon kinds because their commit
 * rebuilds geometry (the vertices change), which forces the 3D group to
 * reconcile. Shelf's `geometryKey` excludes `position`, so its commit
 * `markDirty` is a no-op and nothing reconciled the 3D group off the cleared
 * live transform — the 2D SVG moved but the 3D mesh stayed put. Writing the
 * scene directly removes that second source of truth entirely.
 */
export declare const shelfFloorplanMoveTarget: FloorplanMoveTarget<ShelfNode>;
//# sourceMappingURL=floorplan-move.d.ts.map