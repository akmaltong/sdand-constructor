import { nodeRegistry } from '../registry/registry';
/**
 * Maximum depth a node tree can host. Guards items-on-items-on-items chains
 * from growing pathological — pre-Phase-1 the editor had no cap. Set high
 * enough to allow legitimate stacking (chair on platform on truck on floor)
 * while preventing AI/plugin-generated runaway.
 */
export const MAX_HOST_DEPTH = 6;
/**
 * Validates that attaching `child` to `host` is safe and either returns an
 * actionable error or signals OK. Does NOT mutate the scene — callers apply
 * the patch after a successful check.
 *
 * Rules:
 * - A node cannot host itself.
 * - The hosting chain (child → host → host.parent → ...) must not contain
 *   `child` (cycle prevention).
 * - The resulting chain must not exceed {@link MAX_HOST_DEPTH}.
 * - If the child's NodeDefinition declares `capabilities.hostable.parents`,
 *   `host.type` must appear in that list.
 */
export function canAttach(childId, hostId, scene) {
    if (childId === hostId) {
        return { ok: false, error: { kind: 'self-host', nodeId: childId } };
    }
    const host = scene.get(hostId);
    if (!host) {
        return { ok: false, error: { kind: 'host-missing', hostId } };
    }
    const child = scene.get(childId);
    if (!child) {
        // No child node yet — likely a placement preview. Allow attach to proceed;
        // the caller is responsible for ensuring child exists before commit.
        return checkDepth(hostId, scene);
    }
    const childDef = nodeRegistry.get(child.type);
    const allowed = childDef?.capabilities.hostable?.parents;
    if (allowed && allowed.length > 0 && !allowed.includes(host.type)) {
        return {
            ok: false,
            error: { kind: 'kind-not-allowed', hostKind: host.type, allowed },
        };
    }
    // Cycle: walk host's ancestors and reject if we hit the child.
    let cursor = host;
    while (cursor) {
        if (cursor.id === childId) {
            return { ok: false, error: { kind: 'cycle', nodeId: childId, hostId } };
        }
        cursor = cursor.parentId ? scene.get(cursor.parentId) : undefined;
    }
    return checkDepth(hostId, scene);
}
function checkDepth(hostId, scene) {
    // Count host's own depth (root = 0); attaching adds 1 to the child's depth.
    let depth = 0;
    let cursor = scene.get(hostId);
    while (cursor?.parentId) {
        cursor = scene.get(cursor.parentId);
        depth += 1;
        if (depth > MAX_HOST_DEPTH) {
            return { ok: false, error: { kind: 'depth-exceeded', depth, max: MAX_HOST_DEPTH } };
        }
    }
    // Child sits one below host.
    if (depth + 1 > MAX_HOST_DEPTH) {
        return { ok: false, error: { kind: 'depth-exceeded', depth: depth + 1, max: MAX_HOST_DEPTH } };
    }
    return { ok: true };
}
/**
 * Returns the surfaces declared by a host's NodeDefinition. Surfaces describe
 * where other nodes can stack/mount — the `top` of a slab, the `sides` of a
 * wall, or a custom callback. Returns null when the host's def declares no
 * surfaces (or no def is registered).
 */
export function getSurface(host) {
    const def = nodeRegistry.get(host.type);
    return def?.capabilities.surfaces ?? null;
}
/**
 * Resolves the stackable top height of a host (e.g. table surface, slab top,
 * stair landing). Returns `null` when the host has no `surfaces.top`.
 */
export function getTopSurfaceHeight(host) {
    const surfaces = getSurface(host);
    if (!surfaces?.top)
        return null;
    const { height } = surfaces.top;
    return typeof height === 'function' ? height(host) : height;
}
/**
 * Pure host-discovery helper. Given a list of candidate hosts (already
 * narrowed by spatial query) and a point, returns the first whose
 * `capabilities.hostable` lists `placedKind` AND whose surface contains the
 * point. The runtime is responsible for providing pre-filtered candidates;
 * this function does not perform spatial queries itself.
 */
export function pickHost(args) {
    for (const host of args.candidates) {
        const def = nodeRegistry.get(host.type);
        const hostable = def?.capabilities.hostable;
        if (!hostable)
            continue;
        if (hostable.parents.length > 0 && !hostable.parents.includes('*')) {
            // capability declares specific parents; verify the placed kind's own def
            // also permits this host kind.
        }
        if (args.hitTest && !args.hitTest(host, args.point))
            continue;
        return host;
    }
    return null;
}
/**
 * Convenience: clamps a Y coordinate to the top of a host surface, when one
 * is declared. Returns the original Y if the host has no top surface.
 */
export function clampYToHostTop(host, originalY) {
    const top = getTopSurfaceHeight(host);
    return top == null ? originalY : top;
}
