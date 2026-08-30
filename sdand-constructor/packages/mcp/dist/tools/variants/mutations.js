/**
 * Tiny Park-Miller PRNG. Returns a function that produces uniformly
 * distributed floats in [0, 1) without bitwise operators.
 */
export function mulberry32(seed) {
    let state = Math.trunc(Math.abs(seed)) % 2_147_483_647;
    if (state === 0)
        state = 1;
    return () => {
        state = (state * 16_807) % 2_147_483_647;
        return (state - 1) / 2_147_483_646;
    };
}
/** Pick a random element from a non-empty array. */
function pickFrom(rng, values) {
    const idx = Math.floor(rng() * values.length);
    return values[Math.min(idx, values.length - 1)];
}
/** Shallow clone a scene graph: nodes are copied one level deep, node dict is fresh. */
function cloneGraph(graph) {
    const clonedNodes = {};
    for (const [id, node] of Object.entries(graph.nodes)) {
        // structuredClone so sub-objects (arrays, tuples, metadata) are independent.
        clonedNodes[id] = structuredClone(node);
    }
    return {
        nodes: clonedNodes,
        rootNodeIds: [...graph.rootNodeIds],
        ...(graph.collections ? { collections: structuredClone(graph.collections) } : {}),
    };
}
const WALL_THICKNESS_OPTIONS = [0.1, 0.15, 0.2, 0.25];
const WALL_HEIGHT_OPTIONS = [2.4, 2.6, 2.7, 3.0];
const FENCE_STYLES = ['privacy', 'slat', 'rail'];
/** Fisher–Yates shuffle in place using the provided RNG. */
function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}
/**
 * Compute 2D bounds (min/max x/z) of the first `site` node's polygon points,
 * or `null` if no site is present.
 */
function siteBounds(graph) {
    for (const node of Object.values(graph.nodes)) {
        if (node.type !== 'site')
            continue;
        const pts = node.polygon?.points;
        if (!pts || pts.length === 0)
            continue;
        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minZ = Number.POSITIVE_INFINITY;
        let maxZ = Number.NEGATIVE_INFINITY;
        for (const [x, z] of pts) {
            if (x < minX)
                minX = x;
            if (x > maxX)
                maxX = x;
            if (z < minZ)
                minZ = z;
            if (z > maxZ)
                maxZ = z;
        }
        if (!Number.isFinite(minX))
            continue;
        return { minX, maxX, minZ, maxZ };
    }
    return null;
}
/**
 * Heuristic: a wall is a perimeter wall if either of its endpoints sits close
 * to the site polygon's bounding rectangle (within `epsilon`). Returns `false`
 * if there is no site polygon (treat everything as interior so the mutations
 * still exercise something on partial scenes).
 */
function isPerimeterWall(wall, bounds, epsilon = 0.01) {
    if (!(bounds && wall.start && wall.end))
        return false;
    const onBound = (x, z) => Math.abs(x - bounds.minX) <= epsilon ||
        Math.abs(x - bounds.maxX) <= epsilon ||
        Math.abs(z - bounds.minZ) <= epsilon ||
        Math.abs(z - bounds.maxZ) <= epsilon;
    const [sx, sz] = wall.start;
    const [ex, ez] = wall.end;
    return onBound(sx, sz) || onBound(ex, ez);
}
function applyWallThickness(graph, rng) {
    const out = cloneGraph(graph);
    for (const node of Object.values(out.nodes)) {
        if (node.type !== 'wall')
            continue;
        node.thickness = pickFrom(rng, WALL_THICKNESS_OPTIONS);
    }
    return out;
}
function applyWallHeight(graph, rng) {
    const out = cloneGraph(graph);
    for (const node of Object.values(out.nodes)) {
        if (node.type !== 'wall')
            continue;
        node.height = pickFrom(rng, WALL_HEIGHT_OPTIONS);
    }
    return out;
}
function applyZoneLabels(graph, rng) {
    const out = cloneGraph(graph);
    const zoneNodes = [];
    for (const node of Object.values(out.nodes)) {
        if (node.type === 'zone')
            zoneNodes.push(node);
    }
    if (zoneNodes.length < 2)
        return out;
    const labels = zoneNodes.map((z) => z.name ?? '');
    shuffleInPlace(labels, rng);
    for (let i = 0; i < zoneNodes.length; i++) {
        ;
        zoneNodes[i].name = labels[i];
    }
    return out;
}
function applyRoomProportions(graph, rng) {
    const out = cloneGraph(graph);
    const bounds = siteBounds(out);
    for (const node of Object.values(out.nodes)) {
        if (node.type !== 'wall')
            continue;
        const wall = node;
        if (!(wall.start && wall.end))
            continue;
        if (isPerimeterWall(wall, bounds))
            continue;
        // Nudge each endpoint by ±10% of its current value.
        const nudge = (v) => v * (1 + (rng() * 2 - 1) * 0.1);
        const clampX = (v) => bounds ? Math.min(bounds.maxX, Math.max(bounds.minX, v)) : v;
        const clampZ = (v) => bounds ? Math.min(bounds.maxZ, Math.max(bounds.minZ, v)) : v;
        const [sx, sz] = wall.start;
        const [ex, ez] = wall.end;
        wall.start = [clampX(nudge(sx)), clampZ(nudge(sz))];
        wall.end = [clampX(nudge(ex)), clampZ(nudge(ez))];
    }
    return out;
}
function applyOpenPlan(graph, rng) {
    const out = cloneGraph(graph);
    const bounds = siteBounds(out);
    const interiorWallIds = [];
    for (const [id, node] of Object.entries(out.nodes)) {
        if (node.type !== 'wall')
            continue;
        if (isPerimeterWall(node, bounds))
            continue;
        interiorWallIds.push(id);
    }
    if (interiorWallIds.length === 0)
        return out;
    const targetId = interiorWallIds[Math.floor(rng() * interiorWallIds.length)];
    // Collect any openings attached to this wall so we can drop them too.
    const attached = [];
    for (const [attId, node] of Object.entries(out.nodes)) {
        if (node.wallId === targetId)
            attached.push(attId);
    }
    const removal = new Set([targetId, ...attached]);
    // Drop from nodes.
    for (const id of removal)
        delete out.nodes[id];
    // Drop from rootNodeIds (unlikely for walls, but consistent).
    out.rootNodeIds = out.rootNodeIds.filter((id) => !removal.has(id));
    // Drop references from any parent's `children` array.
    for (const parent of Object.values(out.nodes)) {
        if (!('children' in parent && Array.isArray(parent.children))) {
            continue;
        }
        const children = parent.children;
        parent.children = children.filter((child) => {
            if (typeof child === 'string')
                return !removal.has(child);
            if (child && typeof child === 'object' && 'id' in child) {
                return !removal.has(child.id);
            }
            return true;
        });
    }
    return out;
}
function applyDoorPositions(graph, rng) {
    const out = cloneGraph(graph);
    // Group doors by their parent wall so we can space them out and skip collisions.
    const doorsByWall = new Map();
    for (const node of Object.values(out.nodes)) {
        if (node.type !== 'door')
            continue;
        const wallId = node.wallId;
        if (!wallId)
            continue;
        let list = doorsByWall.get(wallId);
        if (!list) {
            list = [];
            doorsByWall.set(wallId, list);
        }
        list.push(node);
    }
    for (const [, doors] of doorsByWall) {
        // Minimum separation along the parametric wall axis — rough keep-away to
        // avoid obvious overlaps.
        const minGap = 0.15;
        const usedTs = [];
        for (const door of doors) {
            let attempts = 0;
            let t = 0.5;
            while (attempts < 8) {
                t = 0.2 + rng() * 0.6; // [0.2, 0.8]
                const collides = usedTs.some((u) => Math.abs(u - t) < minGap);
                if (!collides)
                    break;
                attempts++;
            }
            // If we still collide after 8 attempts, skip this door (leave it alone).
            if (usedTs.some((u) => Math.abs(u - t) < minGap))
                continue;
            usedTs.push(t);
            door.wallT = t;
        }
    }
    return out;
}
function applyFenceStyle(graph, rng) {
    const out = cloneGraph(graph);
    let i = 0;
    for (const node of Object.values(out.nodes)) {
        if (node.type !== 'fence')
            continue;
        // Use rng to choose a rotation offset so each call can produce a different
        // starting point even when called multiple times with the same base.
        const offset = Math.floor(rng() * FENCE_STYLES.length);
        const style = FENCE_STYLES[(i + offset) % FENCE_STYLES.length];
        node.style = style;
        i++;
    }
    return out;
}
/** Pure: apply a single mutation and return a fresh graph. */
export function applyMutation(graph, rng, kind) {
    switch (kind) {
        case 'wall-thickness':
            return applyWallThickness(graph, rng);
        case 'wall-height':
            return applyWallHeight(graph, rng);
        case 'zone-labels':
            return applyZoneLabels(graph, rng);
        case 'room-proportions':
            return applyRoomProportions(graph, rng);
        case 'open-plan':
            return applyOpenPlan(graph, rng);
        case 'door-positions':
            return applyDoorPositions(graph, rng);
        case 'fence-style':
            return applyFenceStyle(graph, rng);
    }
}
/**
 * Human-readable summary of the mutations applied to a variant. Reads the
 * interesting fields from the graph (e.g. first wall's thickness/height).
 */
export function describeVariant(graph, mutations) {
    const parts = [];
    if (mutations.includes('wall-thickness')) {
        const t = firstWallField(graph, 'thickness');
        if (t !== null)
            parts.push(`wall thickness ${t}m`);
    }
    if (mutations.includes('wall-height')) {
        const h = firstWallField(graph, 'height');
        if (h !== null)
            parts.push(`wall height ${h}m`);
    }
    if (mutations.includes('zone-labels')) {
        const names = [];
        for (const node of Object.values(graph.nodes)) {
            if (node.type === 'zone')
                names.push(node.name ?? '');
        }
        if (names.length > 0)
            parts.push(`zones [${names.join(', ')}]`);
    }
    if (mutations.includes('room-proportions'))
        parts.push('room proportions nudged');
    if (mutations.includes('open-plan'))
        parts.push('open-plan');
    if (mutations.includes('door-positions'))
        parts.push('doors repositioned');
    if (mutations.includes('fence-style')) {
        const s = firstFenceField(graph, 'style');
        if (s !== null)
            parts.push(`fence style ${s}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'no-op';
}
function firstWallField(graph, field) {
    for (const node of Object.values(graph.nodes)) {
        if (node.type !== 'wall')
            continue;
        const v = node[field];
        if (typeof v === 'number')
            return v;
    }
    return null;
}
function firstFenceField(graph, field) {
    for (const node of Object.values(graph.nodes)) {
        if (node.type !== 'fence')
            continue;
        const v = node[field];
        if (typeof v === 'string')
            return v;
    }
    return null;
}
