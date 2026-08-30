import { generateId } from '../schema/base';
function extractIdPrefix(id) {
    const i = id.indexOf('_');
    return i === -1 ? 'node' : id.slice(0, i);
}
function getChildIds(node) {
    if ('children' in node && Array.isArray(node.children)) {
        return node.children;
    }
    return [];
}
/**
 * Collect the subtree of nodes rooted at `rootId` from the live scene.
 *
 * - BFS walk via `node.children` arrays — order is stable and matches
 *   declaration order on container kinds.
 * - Returns the live node references (not clones). Cheap; the caller
 *   chooses whether to deep-clone for persistence.
 * - Returns `null` if `rootId` is missing.
 */
export function collectSubtree(nodes, rootId) {
    const root = nodes[rootId];
    if (!root)
        return null;
    const descendants = [];
    const seen = new Set([rootId]);
    const queue = [...getChildIds(root)];
    let head = 0;
    while (head < queue.length) {
        const id = queue[head++];
        if (seen.has(id))
            continue;
        const node = nodes[id];
        if (!node)
            continue;
        seen.add(id);
        descendants.push(node);
        for (const childId of getChildIds(node))
            queue.push(childId);
    }
    return { root, descendants };
}
/**
 * Clone a flat array of nodes with fresh IDs and rewired references,
 * ready to insert via `useScene.createNodes`.
 *
 * Transformations applied:
 *   1. Deep-clone each node via JSON round-trip (strips three.js refs,
 *      functions, circular links — same trick `cloneLevelSubtree` uses).
 *   2. Mint a fresh id for every node, preserving the prefix
 *      (`wall_…`, `door_…`, etc.) so logs and lookups stay readable.
 *   3. Rewrite `parentId`, `children[]` to use the fresh ids.
 *   4. Stamp `position` onto the root if provided.
 *   5. Set the root's `parentId` to `opts.parentId` when supplied.
 *
 * Intentionally generic — no awareness of host refs (`wallId`/`wallT`
 * etc.). The caller is responsible for stripping or re-deriving those
 * before / after calling this function. See `getHostRefFields(def)`.
 */
export function cloneNodesInto(nodes, opts) {
    // Phase 1 — mint fresh ids for every node, preserving the prefix.
    const idMap = new Map();
    for (const node of nodes) {
        const prefix = extractIdPrefix(node.id);
        idMap.set(node.id, generateId(prefix));
    }
    const rootFreshId = idMap.get(opts.rootId);
    if (!rootFreshId) {
        throw new Error(`cloneNodesInto: rootId "${opts.rootId}" not found in supplied nodes array`);
    }
    // Phase 2 — clone each node + rewire references.
    const out = [];
    let root = null;
    for (const original of nodes) {
        const cloned = JSON.parse(JSON.stringify(original));
        const freshId = idMap.get(original.id);
        cloned.id = freshId;
        // parentId: root's parentId becomes opts.parentId (or preserved
        // value if not supplied). Descendants point at the remapped parent.
        if (original.id === opts.rootId) {
            ;
            cloned.parentId =
                opts.parentId !== undefined
                    ? opts.parentId
                    : (cloned.parentId ?? null);
        }
        else if (cloned.parentId) {
            const parentFresh = idMap.get(cloned.parentId);
            cloned.parentId = parentFresh ?? null;
        }
        // children[]: remap any internal references, drop external ones
        // (a descendant pointing at a sibling that didn't make it into
        // `nodes` would dangle — `filter` drops those gracefully).
        if ('children' in cloned && Array.isArray(cloned.children)) {
            ;
            cloned.children = cloned.children
                .map((cid) => idMap.get(cid))
                .filter((cid) => cid !== undefined);
        }
        if (original.id === opts.rootId) {
            if (opts.position) {
                ;
                cloned.position = [
                    opts.position[0],
                    opts.position[1],
                    opts.position[2],
                ];
            }
            root = cloned;
        }
        else {
            out.push(cloned);
        }
    }
    if (!root) {
        throw new Error('cloneNodesInto: root node missing after clone');
    }
    return { rootId: rootFreshId, nodes: [root, ...out], idMap };
}
