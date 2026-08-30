import type { ColumnNode, FloorplanGeometry, GeometryContext } from '@pascal-app/core';
/**
 * Stage C floor-plan builder for column. Inlined from the legacy
 * `getColumnPlanFootprint` helper in `floorplan-panel.tsx`. The
 * footprint shape depends on `crossSection` (square / rectangular /
 * round / octagonal / sixteen-sided) and `supportStyle` (vertical /
 * a-frame / x-brace / etc.) — brace supports use a rotated rectangle
 * spanning the base spread; standalone columns use the shaft profile.
 *
 * When selected, switches to a themed accent stroke and emits the
 * orange move-handle dot, four perpendicular side move-arrows for
 * dragging the body, and a rotate-arrow at the front-right corner.
 */
export declare function buildColumnFloorplan(node: ColumnNode, ctx: GeometryContext): FloorplanGeometry | null;
//# sourceMappingURL=floorplan.d.ts.map