import { type FloorplanGeometry, type GeometryContext, type WallNode } from '@pascal-app/core';
/**
 * Stage C floor-plan builder for wall — emits the full chrome stack the
 * legacy `floorplan-panel.tsx` rendered inline:
 *
 *   1. The mitered footprint polygon (themed fill + stroke).
 *   2. A diagonal hatch overlay when selected.
 *   3. A transparent hit-line on the centerline so the user can grab the
 *      wall body easily.
 *   4. Two endpoint handles (start + end) when selected — the registry
 *      layer hosts the 5-circle stack + hover transitions + 2D drag.
 *   5. A small dimension label at the midpoint when selected.
 *
 * `ctx.siblings` provides other walls in the level so
 * `calculateLevelMiters` computes correct corner joins.
 *
 * Performance note: this recomputes level miter data per wall (O(N²)
 * across N walls in the level). For < 100 walls per level this is
 * sub-millisecond. If a real perf hotspot surfaces, the
 * `ctx.levelData?.miters` extension flagged in the plan moves the batch
 * computation to the dispatcher.
 */
export declare function buildWallFloorplan(node: WallNode, ctx: GeometryContext): FloorplanGeometry | null;
//# sourceMappingURL=floorplan.d.ts.map