import { nodeRegistry } from '../../registry';
import { spatialGridManager } from './spatial-grid-manager';
function finiteSlabElevation(elevation) {
    return Number.isFinite(elevation) ? elevation : 0;
}
function withPositionAndRotation({ node, position, rotation, }) {
    return {
        ...node,
        position,
        ...(rotation !== undefined ? { rotation } : {}),
    };
}
export function getFloorPlacedFootprints(floorPlaced, node, ctx) {
    const rawFootprints = floorPlaced.footprints?.(node, ctx);
    if (rawFootprints)
        return [...rawFootprints];
    const footprint = floorPlaced.footprint?.(node, ctx);
    return footprint ? [footprint] : [];
}
export function getFloorPlacedElevation({ node, nodes, position, rotation, levelId, }) {
    const floorPlaced = nodeRegistry.get(node.type)?.capabilities?.floorPlaced;
    if (!floorPlaced)
        return 0;
    const effectiveNode = withPositionAndRotation({ node, position, rotation });
    if (floorPlaced.applies && !floorPlaced.applies(effectiveNode))
        return 0;
    const parentId = effectiveNode.parentId ?? null;
    const parent = parentId ? nodes[parentId] : null;
    if (parentId && !parent)
        return 0;
    if (parent && parent.type !== 'level')
        return 0;
    if (!parent && !levelId)
        return 0;
    const resolvedLevelId = parent?.type === 'level' ? parent.id : levelId;
    if (!resolvedLevelId)
        return 0;
    let maxElevation = Number.NEGATIVE_INFINITY;
    for (const footprint of getFloorPlacedFootprints(floorPlaced, effectiveNode, { nodes })) {
        const footprintPosition = footprint.position ?? position;
        const elevation = finiteSlabElevation(spatialGridManager.getSlabElevationForItem(resolvedLevelId, footprintPosition, footprint.dimensions, footprint.rotation));
        if (elevation > maxElevation) {
            maxElevation = elevation;
        }
    }
    return maxElevation === Number.NEGATIVE_INFINITY ? 0 : maxElevation;
}
export function getFloorStackedPosition(args) {
    const [x, y, z] = args.position;
    return [x, y + getFloorPlacedElevation(args), z];
}
