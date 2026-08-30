import type { FloorplanGeometry, GeometryContext, ZoneNode } from '@pascal-app/core';
/**
 * Stage C floor-plan builder for zone. Zones are colored polygons —
 * fill + outline both come from `zone.color`. Selection adds an
 * accent-colored outline.
 *
 * The zone's `name` renders as a centered text label at the polygon's
 * geometric centroid. The registry layer sorts zones before every
 * other kind so the label + polygon sit *under* walls / slabs /
 * furniture in the SVG document order (= z-order).
 */
export declare function buildZoneFloorplan(node: ZoneNode, ctx: GeometryContext): FloorplanGeometry | null;
//# sourceMappingURL=floorplan.d.ts.map