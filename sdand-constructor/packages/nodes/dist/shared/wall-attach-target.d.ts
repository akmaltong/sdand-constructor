import { type AnyNode, type AnyNodeId, type WallNode } from '@pascal-app/core';
export type WallHit = {
    wall: WallNode;
    /** Distance along the wall from `start` (clamped to [0, length]). */
    localX: number;
    /** Signed perpendicular distance from the wall axis (+ on the "front" side). */
    perpDistance: number;
    /** Which face of the wall the pointer was on. */
    side: 'front' | 'back';
    /** Wall direction unit vector, x. */
    dirX: number;
    /** Wall direction unit vector, y (== z in plan). */
    dirY: number;
    /** Wall length in metres. */
    wallLength: number;
    /**
     * Rotation around Y in **wall-local** space — 0 for the front face,
     * π for the back. Matches the 3D `calculateItemRotation(normal)`
     * convention (normal +Z → 0, normal -Z → π). Items / doors / windows
     * are children of the wall mesh, so their `rotation.y` is in the
     * wall's local frame; writing a world-space rotation here would mis-
     * orient the node by `wallRotation` (off by 90° on vertical walls).
     */
    itemRotation: number;
};
export declare function projectWallLocalPointToPlan(wall: WallNode, localX: number, localZ?: number): [number, number];
/**
 * Walk every wall under `parentLevelId` and return the closest one to
 * `planPoint`, or `null` if no wall is within `WALL_SNAP_DISTANCE_M`.
 * `excludeWallId` skips a specific wall (e.g. the current parent during
 * a re-parent flow if you want a "must change" guard).
 */
export declare function findClosestWallInPlan(planPoint: readonly [number, number], nodes: Record<AnyNodeId, AnyNode>, parentLevelId: AnyNodeId | null, excludeWallId?: AnyNodeId): WallHit | null;
/**
 * Figma-style alignment for a wall-hosted opening / item, along the wall
 * axis. Snaps the moving node's edges (or centre) to other attachments'
 * edges/centres on the same wall, plus the wall ends. Edge-to-edge first,
 * so two doors line up flush.
 *
 * Returns the adjusted `localX` when a neighbour stop is within threshold,
 * or `null` when nothing aligns — callers treat `null` as "no alignment,
 * fall back to the grid snap". This lets along-wall alignment COMPETE with
 * the 0.5m grid (openings have arbitrary widths rarely on the grid, so
 * layering on top of the grid snap would almost never trigger).
 *
 * Snap-only for v1 — no guide is published (the floor-plan guide layer
 * renders XZ guides; an along-wall guide on a diagonal wall needs extra
 * projection work, deferred).
 */
export declare function snapLocalXToNeighbors(args: {
    wall: WallNode;
    localX: number;
    width: number;
    selfId: AnyNodeId;
    nodes: Record<AnyNodeId, AnyNode>;
    threshold?: number;
}): number | null;
//# sourceMappingURL=wall-attach-target.d.ts.map