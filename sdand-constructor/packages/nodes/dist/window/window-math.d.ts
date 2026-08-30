import { type WallNode } from '@pascal-app/core';
/**
 * Converts wall-local (X along wall, Y = height above wall base) to world XYZ.
 * Wall XZ uses level-local coordinates (levels only offset in Y, not XZ).
 * Pass levelYOffset (the level group's current world Y) and slabElevation (the
 * wall mesh's Y within the level group) so the cursor lands at the correct world
 * height — matching how WallSystem positions the wall mesh at slabElevation.
 */
export declare function wallLocalToWorld(wallNode: WallNode, localX: number, localY: number, levelYOffset?: number, slabElevation?: number): [number, number, number];
/**
 * Clamps window center position so it stays fully within wall bounds.
 */
export declare function clampToWall(wallNode: WallNode, localX: number, localY: number, width: number, height: number): {
    clampedX: number;
    clampedY: number;
};
/**
 * Directly checks the wall's children for bounding-box overlap with a proposed window.
 * Works for both `item` type (position[1] = bottom) and `window` type (position[1] = center).
 * The spatial grid only tracks `item` nodes, so windows must be checked this way.
 * Reads the wall's latest children from the store (not the event node) to avoid stale data.
 */
export declare function hasWallChildOverlap(wallId: string, clampedX: number, clampedY: number, width: number, height: number, ignoreId?: string): boolean;
//# sourceMappingURL=window-math.d.ts.map