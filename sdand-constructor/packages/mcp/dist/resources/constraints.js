import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getWallPlanFootprint } from '@pascal-app/core/wall';
/**
 * Empty `WallMiterData` — we don't compute junctions here. The footprint
 * falls back to a simple rectangle based on start/end + thickness, which is
 * correct for non-intersecting walls and an acceptable approximation for
 * constraint hints.
 *
 * Typed via `Parameters<typeof getWallPlanFootprint>[1]` to avoid `any` and
 * to stay in sync with the core signature.
 */
const EMPTY_MITER_DATA = {
    junctionData: new Map(),
    junctions: new Map(),
};
function buildPayload(bridge, levelId) {
    const level = bridge.getNode(levelId);
    if (!level || level.type !== 'level') {
        return {
            error: 'level_not_found',
            levelId,
            slabs: [],
            wallPolygons: [],
        };
    }
    const all = bridge.findNodes({ levelId: levelId });
    const slabs = [];
    const walls = [];
    for (const n of all) {
        if (n.type === 'slab')
            slabs.push(n);
        else if (n.type === 'wall')
            walls.push(n);
    }
    const wallPolygons = [];
    for (const wall of walls) {
        const points = getWallPlanFootprint(wall, EMPTY_MITER_DATA);
        wallPolygons.push({
            wallId: wall.id,
            footprint: points.map((p) => [p.x, p.y]),
        });
    }
    return { levelId, slabs, wallPolygons };
}
/**
 * `pascal://constraints/{levelId}` — per-level geometric constraints used as
 * input hints for agents: slab nodes (with polygons/holes/elevation) + each
 * wall's plan-view footprint polygon.
 */
export function registerConstraints(server, bridge) {
    server.registerResource('constraints', new ResourceTemplate('pascal://constraints/{levelId}', { list: undefined }), {
        title: 'Level constraints',
        description: 'Per-level constraints: slab nodes and wall plan footprints. Returns {error:"level_not_found"} if the level id is unknown.',
        mimeType: 'application/json',
    }, async (uri, variables) => {
        const rawLevelId = variables.levelId;
        const levelId = Array.isArray(rawLevelId) ? rawLevelId[0] : rawLevelId;
        const payload = buildPayload(bridge, levelId ?? '');
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(payload),
                },
            ],
        };
    });
}
