import type { FloorplanGeometry, GeometryContext, RoofNode } from '@pascal-app/core';
/**
 * Roof-level floor-plan builder. Draws the whole merged-roof plan: the
 * unioned silhouette, the valley diagonals at concave junctions, and every
 * segment's ridge/hip/break linework — clipped so a line stops at the valley
 * where its segment overlaps a neighbour, instead of running on at the
 * segment's full length into the cut-away part.
 *
 * Drawing all the linework here (rather than per-segment) is what lets the
 * clip work: the valleys and the neighbouring footprints are all in hand, so
 * each line can be trimmed to the actual merged geometry. The segment
 * builder keeps only its hit-target / selection chrome.
 *
 * Composition uses the floor plan's negated-rotation convention
 * (segment-local → roof-local → plan). `unionPolygons` returns one ring per
 * disjoint group, so non-touching segments each keep their own outline. The
 * group is decorative (`pointerEvents: 'none'`) — clicks fall through to the
 * segment hit-targets.
 */
export declare function buildRoofFloorplan(node: RoofNode, ctx: GeometryContext): FloorplanGeometry | null;
//# sourceMappingURL=floorplan.d.ts.map