/**
 * Pure alignment-guide resolver — no React, no DOM, no scene access.
 *
 * Given a moving object's anchor points at its proposed position and a
 * pool of candidate anchors from nearby static objects, returns:
 *   - the best per-axis matches as `Guide` rendering primitives, and
 *   - an optional `{ dx, dz }` snap delta the caller can apply.
 *
 * Anchors are 2D points on the floor plane (XZ, in world meters). The
 * resolver picks at most one match per axis: the smallest |Δx| match
 * snaps X; the smallest |Δz| match snaps Z. This mirrors Figma's
 * behaviour — guides appear along the matched axes, regardless of how
 * many neighbours could have matched.
 *
 * Two guides max per call keeps the visual signal sharp at the cost of
 * not surfacing every possible alignment at once. Multi-guide ("this
 * lines up with three things") is intentionally out of scope for v1.
 */
const EMPTY = { guides: [], snap: null };
/** Forward rotation: local XZ → world XZ for a node whose parent has
 *  position `bx,_,bz` and rotation-Y `rotY` (radians). Matches the
 *  transform used throughout the editor's tools / floor-plan. */
function localToWorld(x, z, bx, bz, cos, sin) {
    return {
        x: bx + x * cos + z * sin,
        z: bz - x * sin + z * cos,
    };
}
function transformAnchorToWorld(anchor, bx, bz, cos, sin) {
    const w = localToWorld(anchor.x, anchor.z, bx, bz, cos, sin);
    return { nodeId: anchor.nodeId, kind: anchor.kind, x: w.x, z: w.z };
}
/**
 * Resolve alignment in WORLD space while accepting BUILDING-LOCAL anchors.
 *
 * Why this exists: the floor-plan grid lives in world XZ (rendered outside
 * the rotated scene group), so alignment must follow the same axes —
 * otherwise rotating a building drags the alignment guides off the visible
 * grid and onto the rotated wall's local axes (the bug the user hit). The
 * resolver itself is frame-agnostic; this wrapper just transforms anchors
 * to world, resolves, then rotates the snap delta back into building-local
 * so callers can add it to a local position without further math.
 *
 * `pose === null` → resolve in the caller's frame as-is (no transform).
 */
export function resolveAlignmentInBuildingWorld(input) {
    const { moving, candidates, threshold, pose } = input;
    if (!pose) {
        return resolveAlignment({ moving, candidates, threshold });
    }
    const cos = Math.cos(pose.rotationY);
    const sin = Math.sin(pose.rotationY);
    const bx = pose.position[0];
    const bz = pose.position[2];
    const movingWorld = moving.map((a) => transformAnchorToWorld(a, bx, bz, cos, sin));
    const candidatesWorld = candidates.map((a) => transformAnchorToWorld(a, bx, bz, cos, sin));
    const result = resolveAlignment({
        moving: movingWorld,
        candidates: candidatesWorld,
        threshold,
    });
    if (!result.snap)
        return { guides: result.guides, snap: null };
    // World → local rotation (orthogonal matrix → transpose). The inverse of
    // `localToWorld` above maps (dx_world, dz_world) → (dx_local, dz_local).
    const dxW = result.snap.dx;
    const dzW = result.snap.dz;
    const dxL = dxW * cos - dzW * sin;
    const dzL = dxW * sin + dzW * cos;
    return { guides: result.guides, snap: { dx: dxL, dz: dzL } };
}
export function resolveAlignment(input) {
    const { moving, candidates, threshold } = input;
    if (threshold <= 0 || moving.length === 0 || candidates.length === 0)
        return EMPTY;
    let bestX = null;
    let bestZ = null;
    for (const m of moving) {
        for (const c of candidates) {
            const dx = c.x - m.x;
            const dz = c.z - m.z;
            const adx = Math.abs(dx);
            const adz = Math.abs(dz);
            if (adx <= threshold &&
                (bestX === null || adz < bestX.perp || (adz === bestX.perp && adx < bestX.primary))) {
                bestX = { delta: dx, primary: adx, perp: adz, m, c };
            }
            if (adz <= threshold &&
                (bestZ === null || adx < bestZ.perp || (adx === bestZ.perp && adz < bestZ.primary))) {
                bestZ = { delta: dz, primary: adz, perp: adx, m, c };
            }
        }
    }
    if (!bestX && !bestZ)
        return EMPTY;
    const dxSnap = bestX?.delta ?? 0;
    const dzSnap = bestZ?.delta ?? 0;
    const guides = [];
    if (bestX) {
        // X-axis match: vertical guide at x = bestX.c.x. The moving anchor
        // ends up at (c.x, m.z + dzSnap). Span the line between them.
        const snappedMz = bestX.m.z + dzSnap;
        const z1 = Math.min(bestX.c.z, snappedMz);
        const z2 = Math.max(bestX.c.z, snappedMz);
        guides.push({
            axis: 'x',
            coord: bestX.c.x,
            from: { x: bestX.c.x, z: z1 },
            to: { x: bestX.c.x, z: z2 },
            movingAnchorKind: bestX.m.kind,
            candidateAnchorKind: bestX.c.kind,
            candidateNodeId: bestX.c.nodeId,
            distance: Math.abs(snappedMz - bestX.c.z),
        });
    }
    if (bestZ) {
        const snappedMx = bestZ.m.x + dxSnap;
        const x1 = Math.min(bestZ.c.x, snappedMx);
        const x2 = Math.max(bestZ.c.x, snappedMx);
        guides.push({
            axis: 'z',
            coord: bestZ.c.z,
            from: { x: x1, z: bestZ.c.z },
            to: { x: x2, z: bestZ.c.z },
            movingAnchorKind: bestZ.m.kind,
            candidateAnchorKind: bestZ.c.kind,
            candidateNodeId: bestZ.c.nodeId,
            distance: Math.abs(snappedMx - bestZ.c.x),
        });
    }
    return { guides, snap: { dx: dxSnap, dz: dzSnap } };
}
// ─── Anchor extractors (pure) ─────────────────────────────────────────
/**
 * Produces the 9 standard anchors for an axis-aligned bounding box on the
 * floor plane: 4 corners, 4 edge midpoints, 1 center. Suitable for any
 * floor-plan entity whose footprint can be expressed as a bbox.
 *
 * Caller is responsible for computing the bbox — the resolver doesn't
 * care how (per-kind dimensions, SVG getBBox(), etc.).
 */
export function bboxAnchors(nodeId, minX, minZ, maxX, maxZ) {
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    return [
        { nodeId, kind: 'corner', x: minX, z: minZ },
        { nodeId, kind: 'corner', x: maxX, z: minZ },
        { nodeId, kind: 'corner', x: maxX, z: maxZ },
        { nodeId, kind: 'corner', x: minX, z: maxZ },
        { nodeId, kind: 'edge-mid', x: cx, z: minZ },
        { nodeId, kind: 'edge-mid', x: maxX, z: cz },
        { nodeId, kind: 'edge-mid', x: cx, z: maxZ },
        { nodeId, kind: 'edge-mid', x: minX, z: cz },
        { nodeId, kind: 'center', x: cx, z: cz },
    ];
}
/**
 * The 4 corner anchors of a bbox — edges only, no edge-midpoints or center.
 * Used where alignment should lock to an object's edges (left/right/front/
 * back), never its centreline.
 */
export function bboxCornerAnchors(nodeId, minX, minZ, maxX, maxZ) {
    return [
        { nodeId, kind: 'corner', x: minX, z: minZ },
        { nodeId, kind: 'corner', x: maxX, z: minZ },
        { nodeId, kind: 'corner', x: maxX, z: maxZ },
        { nodeId, kind: 'corner', x: minX, z: maxZ },
    ];
}
