import { nodeRegistry } from './registry';
const DEFAULT_MAX_DEPTH = 16;
/**
 * Walks the relations graph from one dirty node and returns the full set of
 * IDs (including the starting one) that should be marked dirty. Pure — does
 * NOT call `scene.markDirty`; callers iterate the result.
 *
 * Phase 1 implements:
 * - `hosts`: marks children whose `type` matches the kind list
 * - `affectsSpatial`: marks neighbors found via `spatialQuery`
 *
 * Phase 3 will add `linkedBy: 'endpoint-match'` for wall corner propagation.
 */
export function cascadeDirty(startId, ctx) {
    const result = new Set();
    const maxDepth = ctx.maxDepth ?? DEFAULT_MAX_DEPTH;
    walk(startId, ctx, result, 0, maxDepth);
    return result;
}
function walk(id, ctx, result, depth, maxDepth) {
    if (result.has(id) || depth > maxDepth)
        return;
    result.add(id);
    const node = ctx.scene.get(id);
    if (!node)
        return;
    const def = nodeRegistry.get(node.type);
    if (!def?.relations)
        return;
    const { hosts, affectsSpatial } = def.relations;
    if (hosts && hosts.length > 0) {
        const childIds = ctx.childQuery ? ctx.childQuery(node) : defaultChildIds(node, ctx.scene);
        for (const childId of childIds) {
            const child = ctx.scene.get(childId);
            if (child && hosts.includes(child.type)) {
                walk(childId, ctx, result, depth + 1, maxDepth);
            }
        }
    }
    if (affectsSpatial && affectsSpatial.length > 0 && ctx.spatialQuery) {
        for (const neighborId of ctx.spatialQuery(node, affectsSpatial)) {
            walk(neighborId, ctx, result, depth + 1, maxDepth);
        }
    }
}
/**
 * Fallback children lookup that reads the node's `children: AnyNodeId[]`
 * field if present. Most parametric nodes carry one; nodes that don't will
 * need a `childQuery` override on the context.
 */
function defaultChildIds(node, _scene) {
    const maybeChildren = node.children;
    return Array.isArray(maybeChildren) ? maybeChildren : [];
}
/**
 * Recursively collects every descendant of a node, plus the node itself.
 * Used by `cascadeDelete: 'descendants'` and by tools that need to delete a
 * subtree atomically. Independent of dirty-marking — pure traversal.
 */
export function collectDescendants(startId, ctx) {
    const result = new Set();
    const maxDepth = ctx.maxDepth ?? DEFAULT_MAX_DEPTH;
    walkDescendants(startId, ctx, result, 0, maxDepth);
    return result;
}
function walkDescendants(id, ctx, result, depth, maxDepth) {
    if (result.has(id) || depth > maxDepth)
        return;
    result.add(id);
    const node = ctx.scene.get(id);
    if (!node)
        return;
    const childIds = ctx.childQuery ? ctx.childQuery(node) : defaultChildIds(node, ctx.scene);
    for (const childId of childIds) {
        walkDescendants(childId, ctx, result, depth + 1, maxDepth);
    }
}
