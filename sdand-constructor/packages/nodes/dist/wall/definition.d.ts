import type { NodeDefinition } from '@pascal-app/core';
import { WallNode } from './schema';
/**
 * Wall — the Phase 3 stress test of the registry-driven node model.
 *
 * Stage A: registered (capabilities, relations, parametrics, presentation).
 * Stage B: deferred — wall geometry depends on level-batch miter data that
 *   doesn't fit the generic `(node, ctx) => Group` shape without `ctx.
 *   levelData?.miters`. See plan's "GeometryContext" extension note.
 *   `renderer` + `system` keep wrap-exporting legacy WallRenderer +
 *   WallSystem + WallCutout.
 * Stage C: `def.floorplan` builder produces the mitered plan footprint
 *   polygon using `ctx.siblings` to assemble miter context.
 *   floorplan-panel.tsx's `wallPolygons` short-circuits to [] when
 *   wall is registered.
 */
export declare const wallDefinition: NodeDefinition<typeof WallNode>;
//# sourceMappingURL=definition.d.ts.map