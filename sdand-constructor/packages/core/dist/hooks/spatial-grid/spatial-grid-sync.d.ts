import type { AnyNode, AnyNodeId } from '../../schema';
export declare function resolveLevelId(node: AnyNode, nodes: Record<string, AnyNode>): string;
/**
 * Walks the parent chain of `nodeId` and returns the id of the first ancestor
 * whose `type` is `'level'`, or `null` when no level ancestor exists (orphaned
 * node, top-level building node, etc.). Unlike `resolveLevelId`, this variant:
 *
 * - accepts a node **id** rather than a resolved node, saving the caller a
 *   `nodes[id]` lookup when only the id is at hand.
 * - returns `null` instead of the `'default'` fallback, which lets callers
 *   distinguish "genuinely has no level" from "is a level".
 * - has a loop guard (16 iterations) so a corrupt parent-chain cycle cannot
 *   hang the frame loop.
 */
export declare function findLevelAncestorId(nodeId: AnyNodeId, nodes: Record<string, AnyNode>): string | null;
/**
 * Returns the building id that contains the given level, or `null` if
 * the level is unparented or no enclosing building exists.
 *
 * Most scenes record the relationship via `level.parentId →
 * building.id`, but older serialisations occasionally drop `parentId`
 * even though the building's `children` array still references the
 * level. The fallback scan covers that case.
 *
 * Used by `FloorplanRegistryLayer` to discover building-scoped kinds
 * (`def.floorplanScope === 'building'`) without hardcoding any kind
 * name in the editor layer.
 */
export declare function resolveBuildingForLevel(levelId: AnyNodeId, nodes: Record<AnyNodeId, AnyNode>): AnyNodeId | null;
export declare function initSpatialGridSync(): () => void;
//# sourceMappingURL=spatial-grid-sync.d.ts.map