import { type NodeDefinition } from '@pascal-app/core';
import { RoofNode } from './schema';
/**
 * Roof — Stage A registration. Wrap-exports the legacy `RoofRenderer`
 * + `RoofSystem` (geometry generation via `getRoofSegmentBrushes` +
 * CSG). Inspector / move stay legacy until Stage B-E. `floorplan` draws
 * the merged silhouette (union of the child segments' footprints), so a
 * multi-segment roof reads as one combined shape rather than stacked
 * rectangles.
 *
 * Roof is a "composite" node — it has `roof-segment` children that
 * own per-segment geometry. The parent roof handles overall framing;
 * each segment is its own registered kind (see `roof-segment`).
 */
export declare const roofDefinition: NodeDefinition<typeof RoofNode>;
//# sourceMappingURL=definition.d.ts.map