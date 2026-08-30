import { type MaterialSchema, type PaintCapability, type WallNode, type WallSurfaceSide } from '@pascal-app/core';
/**
 * Resolve which side of a wall the user clicked. Walls expose two
 * paintable surfaces — interior + exterior — split by:
 *   1. Material-slot index from the renderer's groups (1 = interior,
 *      2 = exterior). Cheap reference-equality path.
 *   2. Falls back to the hit-surface normal + local-Z when the
 *      groups aren't conclusive. Front/back of the wall maps to the
 *      node's `frontSide` / `backSide` semantic; absent that, front
 *      → interior, back → exterior.
 *
 * Returns null when the click is too oblique (or lands on the wall's
 * end-cap, etc.) to confidently assign a side.
 */
export declare function resolveWallRole(args: {
    node: WallNode;
    materialIndex: number | null;
    normal: readonly [number, number, number] | undefined;
    localPosition: readonly [number, number, number] | undefined;
}): WallSurfaceSide | null;
export declare function buildWallSurfaceMaterialPatch(node: WallNode, targetSide: WallSurfaceSide, material: MaterialSchema | undefined, materialPreset: string | undefined): Partial<WallNode>;
/**
 * Capability binding for the wall kind. The editor's
 * selection-manager invokes these in place of the legacy
 * `if (node.type === 'wall') { ... }` arms.
 */
export declare const wallPaint: PaintCapability;
//# sourceMappingURL=paint.d.ts.map